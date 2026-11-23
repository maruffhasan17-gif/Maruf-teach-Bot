const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_SUPABASE_URL = process.env.SUPABASE_URL || 'https://piieczrpdqfoswerqgtl.supabase.co';
const DEFAULT_SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpaWVjenJwZHFmb3N3ZXJxZ3RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDU4ODE2OSwiZXhwIjoyMTA2MTY0MTY5fQ.SHOi3gmKGSodPeRRv1dAe56sqf_nLX-YKe3C2oLSAKE';
const TABLE_NAME = 'tp_firestore_docs';

// Helper to attach non-enumerable .toDate() and .toMillis() onto timestamp objects { _seconds, _nanoseconds }
function reviveTimestamps(val) {
  if (!val || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val.map(reviveTimestamps);
  }
  if (typeof val._seconds === 'number') {
    const copy = { ...val };
    const ms = copy._seconds * 1000 + Math.floor((copy._nanoseconds || 0) / 1e6);
    Object.defineProperty(copy, 'toDate', {
      value: () => new Date(ms),
      enumerable: false
    });
    Object.defineProperty(copy, 'toMillis', {
      value: () => ms,
      enumerable: false
    });
    return copy;
  }
  const out = {};
  for (const [k, v] of Object.entries(val)) {
    out[k] = reviveTimestamps(v);
  }
  return out;
}

function makeTimestampObj(ms = Date.now()) {
  const obj = {
    _seconds: Math.floor(ms / 1000),
    _nanoseconds: (ms % 1000) * 1000000
  };
  Object.defineProperty(obj, 'toDate', {
    value: () => new Date(ms),
    enumerable: false
  });
  Object.defineProperty(obj, 'toMillis', {
    value: () => ms,
    enumerable: false
  });
  return obj;
}

const FieldValue = {
  serverTimestamp: () => ({ __tp_fv: 'serverTimestamp' }),
  increment: (n) => ({ __tp_fv: 'increment', operand: Number(n) || 0 }),
  delete: () => ({ __tp_fv: 'delete' }),
  arrayUnion: (...elements) => ({ __tp_fv: 'arrayUnion', elements }),
  arrayRemove: (...elements) => ({ __tp_fv: 'arrayRemove', elements })
};

function isFieldValue(v) {
  return Boolean(v && typeof v === 'object' && typeof v.__tp_fv === 'string');
}

function resolveValueTransform(oldVal, newVal) {
  if (isFieldValue(newVal)) {
    if (newVal.__tp_fv === 'serverTimestamp') {
      return makeTimestampObj(Date.now());
    }
    if (newVal.__tp_fv === 'increment') {
      const base = typeof oldVal === 'number' && Number.isFinite(oldVal) ? oldVal : (parseFloat(oldVal) || 0);
      return Number((base + newVal.operand).toFixed(8));
    }
    if (newVal.__tp_fv === 'arrayUnion') {
      const arr = Array.isArray(oldVal) ? [...oldVal] : [];
      for (const el of newVal.elements) {
        if (!arr.some(x => JSON.stringify(x) === JSON.stringify(el))) arr.push(el);
      }
      return arr;
    }
    if (newVal.__tp_fv === 'arrayRemove') {
      const arr = Array.isArray(oldVal) ? [...oldVal] : [];
      return arr.filter(x => !newVal.elements.some(el => JSON.stringify(x) === JSON.stringify(el)));
    }
    return undefined;
  }
  if (Array.isArray(newVal)) {
    return newVal.map(item => resolveValueTransform(undefined, item));
  }
  if (newVal && typeof newVal === 'object' && typeof newVal._seconds !== 'number' && !(newVal instanceof Date)) {
    const baseObj = (oldVal && typeof oldVal === 'object' && !Array.isArray(oldVal)) ? { ...oldVal } : {};
    for (const [k, v] of Object.entries(newVal)) {
      if (isFieldValue(v) && v.__tp_fv === 'delete') {
        delete baseObj[k];
      } else {
        baseObj[k] = resolveValueTransform(baseObj[k], v);
      }
    }
    return baseObj;
  }
  if (newVal instanceof Date) {
    return makeTimestampObj(newVal.getTime());
  }
  return newVal;
}

function setByPath(targetObj, pathStr, val, isUpdateMode) {
  if (isUpdateMode && pathStr.includes('.')) {
    const parts = pathStr.split('.');
    let cur = targetObj;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!cur[p] || typeof cur[p] !== 'object' || Array.isArray(cur[p])) {
        cur[p] = {};
      } else {
        cur[p] = { ...cur[p] };
      }
      cur = cur[p];
    }
    const lastKey = parts[parts.length - 1];
    if (isFieldValue(val) && val.__tp_fv === 'delete') {
      delete cur[lastKey];
    } else {
      cur[lastKey] = resolveValueTransform(cur[lastKey], val);
    }
  } else {
    if (isFieldValue(val) && val.__tp_fv === 'delete') {
      delete targetObj[pathStr];
    } else {
      targetObj[pathStr] = resolveValueTransform(targetObj[pathStr], val);
    }
  }
}

function applyMutation(existingData, patch, mode = 'set', merge = false) {
  let base = {};
  if ((mode === 'set' && merge) || mode === 'update') {
    base = existingData && typeof existingData === 'object' ? JSON.parse(JSON.stringify(existingData)) : {};
  }
  const isUpdateMode = mode === 'update';
  for (const [k, v] of Object.entries(patch || {})) {
    if (v === undefined) continue;
    setByPath(base, k, v, isUpdateMode);
  }
  return base;
}

function getFieldByPath(obj, fieldPath) {
  if (!obj || typeof obj !== 'object') return undefined;
  if (fieldPath in obj) return obj[fieldPath];
  if (!fieldPath.includes('.')) return obj[fieldPath];
  const parts = fieldPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

function getComparableValue(v) {
  if (v && typeof v === 'object') {
    if (typeof v._seconds === 'number') {
      return v._seconds * 1000 + Math.floor((v._nanoseconds || 0) / 1e6);
    }
    if (typeof v.toMillis === 'function') {
      return v.toMillis();
    }
  }
  return v;
}

function matchesFilter(docData, filter) {
  const rawVal = getFieldByPath(docData, filter.field);
  const op = filter.op;
  const target = filter.value;

  if (op === '==') {
    return rawVal === target;
  }
  if (op === '!=') {
    return rawVal !== target;
  }
  if (op === 'in') {
    if (!Array.isArray(target)) return false;
    return target.includes(rawVal);
  }
  if (op === 'array-contains') {
    return Array.isArray(rawVal) && rawVal.includes(target);
  }
  const a = getComparableValue(rawVal);
  const b = getComparableValue(target);
  if (a === undefined || a === null) return false;
  if (op === '>') return a > b;
  if (op === '>=') return a >= b;
  if (op === '<') return a < b;
  if (op === '<=') return a <= b;
  return false;
}

function createSupabaseFirestore(options = {}) {
  const supabaseUrl = options.supabaseUrl || DEFAULT_SUPABASE_URL;
  const supabaseKey = options.supabaseKey || DEFAULT_SUPABASE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // In-memory write-through mirror cache: Map<collection, Map<doc_id, data>>
  const memStore = new Map();
  const colFetchTs = new Map();
  const docFetchTs = new Map();
  const docWatchers = new Map(); // key: `${col}/${id}` -> Set<callback>
  let initialWarmupPromise = null;

  function getColMap(colName) {
    if (!memStore.has(colName)) {
      memStore.set(colName, new Map());
    }
    return memStore.get(colName);
  }

  function notifyWatchers(colName, docId) {
    const key = `${colName}/${docId}`;
    const listeners = docWatchers.get(key);
    if (!listeners || listeners.size === 0) return;
    const colMap = getColMap(colName);
    const exists = colMap.has(docId);
    const raw = exists ? colMap.get(docId) : undefined;
    const snap = createDocSnapshot(colName, docId, exists, raw);
    for (const cb of listeners) {
      try { cb(snap); } catch (_) {}
    }
  }

  // Warm up all collections into RAM on startup for ultra-fast reads & offline resilience
  async function warmupMemoryMirror() {
    try {
      let allRows = [];
      let from = 0;
      const step = 1000;
      while (true) {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('collection, doc_id, data')
          .range(from, from + step - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allRows = allRows.concat(data);
        if (data.length < step) break;
        from += step;
      }
      const now = Date.now();
      for (const row of allRows) {
        const cMap = getColMap(row.collection);
        cMap.set(String(row.doc_id), row.data || {});
        colFetchTs.set(row.collection, now);
        docFetchTs.set(`${row.collection}/${row.doc_id}`, now);
      }
      console.log(`[SupabaseEngine] ✓ Warmed up ${allRows.length} documents across ${memStore.size} collections from Supabase.`);
    } catch (err) {
      console.warn('[SupabaseEngine] Warmup warning:', err.message);
    }
  }
  initialWarmupPromise = warmupMemoryMirror();

  function createDocSnapshot(colName, docId, exists, rawData) {
    const revived = exists && rawData ? reviveTimestamps(JSON.parse(JSON.stringify(rawData))) : undefined;
    return {
      id: String(docId),
      exists: Boolean(exists),
      ref: createDocRef(colName, docId),
      data: () => (exists && revived ? revived : undefined)
    };
  }

  async function fetchDocFromSupabase(colName, docId, bypassCache = false) {
    const strId = String(docId);
    const cacheKey = `${colName}/${strId}`;
    const colMap = getColMap(colName);
    const now = Date.now();

    // Wait for initial warmup if it's still in flight (takes ~300ms once at boot)
    if (initialWarmupPromise) {
      await initialWarmupPromise.catch(() => {});
      initialWarmupPromise = null;
    }

    const lastFetch = docFetchTs.get(cacheKey) || colFetchTs.get(colName) || 0;
    if (!bypassCache && (now - lastFetch < 4000) && colMap.has(strId)) {
      return createDocSnapshot(colName, strId, true, colMap.get(strId));
    }

    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('data')
        .eq('collection', colName)
        .eq('doc_id', strId)
        .maybeSingle();

      if (error) throw error;
      docFetchTs.set(cacheKey, Date.now());
      if (data && data.data !== undefined) {
        colMap.set(strId, data.data);
        return createDocSnapshot(colName, strId, true, data.data);
      } else {
        colMap.delete(strId);
        return createDocSnapshot(colName, strId, false, undefined);
      }
    } catch (err) {
      // Fallback to memory mirror if transient network error
      const hasInMem = colMap.has(strId);
      return createDocSnapshot(colName, strId, hasInMem, hasInMem ? colMap.get(strId) : undefined);
    }
  }

  async function persistDocToSupabase(colName, docId, finalData) {
    const strId = String(docId);
    const colMap = getColMap(colName);
    colMap.set(strId, finalData);
    docFetchTs.set(`${colName}/${strId}`, Date.now());
    notifyWatchers(colName, strId);

    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert({
        collection: colName,
        doc_id: strId,
        data: finalData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'collection,doc_id' });

    if (error) {
      console.error(`[SupabaseEngine] Write error on ${colName}/${strId}:`, error.message);
      throw new Error(error.message);
    }
  }

  function createDocRef(colName, docId) {
    const strId = String(docId);
    return {
      id: strId,
      path: `${colName}/${strId}`,
      get: async () => fetchDocFromSupabase(colName, strId, false),
      set: async (patchData, setOptions = {}) => {
        const merge = Boolean(setOptions && setOptions.merge);
        let existing = getColMap(colName).get(strId);
        if (merge && existing === undefined) {
          const snap = await fetchDocFromSupabase(colName, strId, true);
          existing = snap.exists ? snap.data() : {};
        }
        const nextData = applyMutation(existing, patchData, 'set', merge);
        await persistDocToSupabase(colName, strId, nextData);
        return { writeTime: new Date().toISOString() };
      },
      update: async (patchData) => {
        let existing = getColMap(colName).get(strId);
        if (existing === undefined) {
          const snap = await fetchDocFromSupabase(colName, strId, true);
          existing = snap.exists ? snap.data() : {};
        }
        const nextData = applyMutation(existing, patchData, 'update', true);
        await persistDocToSupabase(colName, strId, nextData);
        return { writeTime: new Date().toISOString() };
      },
      delete: async () => {
        const colMap = getColMap(colName);
        colMap.delete(strId);
        docFetchTs.delete(`${colName}/${strId}`);
        notifyWatchers(colName, strId);
        await supabase
          .from(TABLE_NAME)
          .delete()
          .eq('collection', colName)
          .eq('doc_id', strId);
        return { writeTime: new Date().toISOString() };
      },
      onSnapshot: (onNext, onError) => {
        const key = `${colName}/${strId}`;
        if (!docWatchers.has(key)) docWatchers.set(key, new Set());
        docWatchers.get(key).add(onNext);
        fetchDocFromSupabase(colName, strId, false)
          .then(snap => onNext(snap))
          .catch(err => { if (onError) onError(err); });
        return () => {
          docWatchers.get(key)?.delete(onNext);
        };
      }
    };
  }

  async function refreshCollectionFromSupabase(colName) {
    if (initialWarmupPromise) {
      await initialWarmupPromise.catch(() => {});
      initialWarmupPromise = null;
    }
    const now = Date.now();
    const lastColFetch = colFetchTs.get(colName) || 0;
    const colMap = getColMap(colName);
    if (now - lastColFetch < 4000 && colMap.size > 0) {
      return colMap;
    }
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('doc_id, data')
        .eq('collection', colName);
      if (error) throw error;
      const freshMap = new Map();
      for (const row of (data || [])) {
        freshMap.set(String(row.doc_id), row.data || {});
        docFetchTs.set(`${colName}/${row.doc_id}`, Date.now());
      }
      memStore.set(colName, freshMap);
      colFetchTs.set(colName, Date.now());
      return freshMap;
    } catch (err) {
      return colMap;
    }
  }

  function createQuery(colName, filters = [], orders = [], limitCount = null) {
    const queryObj = {
      where: (field, op, value) => createQuery(colName, [...filters, { field, op, value }], orders, limitCount),
      orderBy: (field, dir = 'asc') => createQuery(colName, filters, [...orders, { field, dir: String(dir).toLowerCase() }], limitCount),
      limit: (n) => createQuery(colName, filters, orders, Number(n)),
      count: () => ({
        get: async () => {
          const snap = await queryObj.get();
          return { data: () => ({ count: snap.size }) };
        }
      }),
      get: async () => {
        const colMap = await refreshCollectionFromSupabase(colName);
        let entries = [];
        for (const [docId, rawData] of colMap.entries()) {
          let pass = true;
          for (const f of filters) {
            if (!matchesFilter(rawData, f)) {
              pass = false;
              break;
            }
          }
          if (pass) {
            entries.push({ docId, rawData });
          }
        }

        if (orders.length > 0) {
          entries.sort((a, b) => {
            for (const o of orders) {
              const va = getComparableValue(getFieldByPath(a.rawData, o.field)) ?? 0;
              const vb = getComparableValue(getFieldByPath(b.rawData, o.field)) ?? 0;
              if (va < vb) return o.dir === 'desc' ? 1 : -1;
              if (va > vb) return o.dir === 'desc' ? -1 : 1;
            }
            return 0;
          });
        }

        if (limitCount !== null && Number.isFinite(limitCount) && limitCount >= 0) {
          entries = entries.slice(0, limitCount);
        }

        const docs = entries.map(e => createDocSnapshot(colName, e.docId, true, e.rawData));
        return {
          docs,
          empty: docs.length === 0,
          size: docs.length,
          forEach: (cb) => docs.forEach(cb)
        };
      }
    };
    return queryObj;
  }

  function createCollectionRef(colName) {
    const baseQuery = createQuery(colName, [], [], null);
    return {
      id: colName,
      doc: (docId) => {
        const id = docId !== undefined && docId !== null && String(docId).trim() !== ''
          ? String(docId)
          : crypto.randomBytes(10).toString('hex');
        return createDocRef(colName, id);
      },
      add: async (data) => {
        const autoId = crypto.randomBytes(10).toString('hex');
        const ref = createDocRef(colName, autoId);
        await ref.set(data);
        return ref;
      },
      where: baseQuery.where,
      orderBy: baseQuery.orderBy,
      limit: baseQuery.limit,
      count: baseQuery.count,
      get: baseQuery.get
    };
  }

  const db = {
    collection: (colName) => createCollectionRef(colName),
    runTransaction: async (updateFunction) => {
      const stagedWrites = [];
      const tx = {
        get: async (refOrQuery) => {
          if (refOrQuery && typeof refOrQuery.path === 'string') {
            const [cName, dId] = refOrQuery.path.split('/');
            return fetchDocFromSupabase(cName, dId, true);
          }
          return refOrQuery.get();
        },
        set: (docRef, data, options = {}) => {
          stagedWrites.push({ type: 'set', docRef, data, options });
          return tx;
        },
        update: (docRef, data) => {
          stagedWrites.push({ type: 'update', docRef, data });
          return tx;
        },
        delete: (docRef) => {
          stagedWrites.push({ type: 'delete', docRef });
          return tx;
        }
      };

      const result = await updateFunction(tx);
      for (const op of stagedWrites) {
        if (op.type === 'set') {
          await op.docRef.set(op.data, op.options);
        } else if (op.type === 'update') {
          await op.docRef.update(op.data);
        } else if (op.type === 'delete') {
          await op.docRef.delete();
        }
      }
      return result;
    },
    listCollections: async () => {
      await initialWarmupPromise?.catch(() => {});
      return Array.from(memStore.keys()).map(id => createCollectionRef(id));
    }
  };

  return { db, FieldValue, supabase };
}

let sharedInstance = null;
function getSupabaseFirestore(options = {}) {
  if (!sharedInstance) {
    sharedInstance = createSupabaseFirestore(options);
  }
  return sharedInstance;
}

module.exports = { createSupabaseFirestore, getSupabaseFirestore, FieldValue };
