// FEG Stage PRO v3.6.35 — ProjectStorage module
// Responsibility: local stage orders, truss projects and JSON project file helpers.
// Classic-compatible module: attaches API to window.FEGModules.ProjectStorage.
(function (global) {
    'use strict';

    const STORAGE_KEYS = {
        stageOrders: 'orders',
        trussProjects: 'fegTrussProjects'
    };

    function getSupabaseStorage() {
        return global.FEGModules && global.FEGModules.SupabaseStorage ? global.FEGModules.SupabaseStorage : null;
    }

    function safeParseList(storageKey) {
        try {
            const raw = global.localStorage ? global.localStorage.getItem(storageKey) : null;
            const parsed = JSON.parse(raw || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            return [];
        }
    }

    function writeList(storageKey, list) {
        if (!global.localStorage) return;
        global.localStorage.setItem(storageKey, JSON.stringify(Array.isArray(list) ? list : []));
    }

    function getProjects(storageKey) {
        const supabaseStorage = getSupabaseStorage();
        if (supabaseStorage && typeof supabaseStorage.getLocalProjects === 'function') {
            return supabaseStorage.getLocalProjects(storageKey);
        }
        return safeParseList(storageKey);
    }

    function setProjects(storageKey, projects) {
        const list = Array.isArray(projects) ? projects : [];
        const supabaseStorage = getSupabaseStorage();
        if (supabaseStorage && typeof supabaseStorage.setLocalProjects === 'function') {
            supabaseStorage.setLocalProjects(storageKey, list);
            return;
        }
        writeList(storageKey, list);
    }

    function getStageOrders() {
        return getProjects(STORAGE_KEYS.stageOrders);
    }

    function setStageOrders(orders) {
        setProjects(STORAGE_KEYS.stageOrders, orders);
    }

    function getTrussProjects() {
        return getProjects(STORAGE_KEYS.trussProjects);
    }

    function setTrussProjects(projects) {
        setProjects(STORAGE_KEYS.trussProjects, projects);
    }

    function findProjectIndex(projects, project) {
        const list = Array.isArray(projects) ? projects : [];
        const supabaseStorage = getSupabaseStorage();
        if (supabaseStorage && typeof supabaseStorage.findLocalProjectIndex === 'function') {
            return supabaseStorage.findLocalProjectIndex(list, project);
        }
        if (!project) return -1;
        if (project.cloudId) {
            const byCloud = list.findIndex(item => String(item.cloudId || '') === String(project.cloudId));
            if (byCloud >= 0) return byCloud;
        }
        return list.findIndex(item => String(item.id || item._id) === String(project.id || project._id));
    }

    function findProjectById(projects, idRaw) {
        const list = Array.isArray(projects) ? projects : [];
        let project = list.find(item => String(item.id || item._id) === String(idRaw));
        if (!project) {
            const idx = parseInt(idRaw, 10);
            if (!Number.isNaN(idx)) project = list[idx];
        }
        return project || null;
    }


    function findProjectIndexById(projects, idRaw, options) {
        const list = Array.isArray(projects) ? projects : [];
        const opts = options || {};
        let idx = list.findIndex(item => String(item.id || item._id) === String(idRaw));
        if (idx < 0 && opts.allowIndexFallback) {
            const fallbackIndex = parseInt(idRaw, 10);
            if (!Number.isNaN(fallbackIndex) && list[fallbackIndex]) idx = fallbackIndex;
        }
        return idx;
    }

    function findStageOrderById(idRaw) {
        return findProjectById(getStageOrders(), idRaw);
    }

    function findTrussProjectById(idRaw) {
        return findProjectById(getTrussProjects(), idRaw);
    }

    function limitProjects(projects, maxItems) {
        const list = Array.isArray(projects) ? projects : [];
        const limit = Number(maxItems || 0);
        return limit > 0 ? list.slice(0, limit) : list;
    }

    function countByClient(projects, clientName) {
        const target = String(clientName || '').trim().toLowerCase();
        if (!target) return 0;
        return (Array.isArray(projects) ? projects : []).filter(project => {
            return String(project.client || '').trim().toLowerCase() === target;
        }).length;
    }

    function safeFileNamePart(value, fallback) {
        return String(value || fallback || 'project').replace(/[\\/:*?"<>|]/g, '_');
    }

    function downloadJson(filename, data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function buildStageProjectExportPayload(order) {
        return {
            type: 'feg-stage-pro-project',
            app: 'FEG Stage PRO',
            version: '2.2',
            exportedAt: new Date().toISOString(),
            project: order
        };
    }

    function normalizeImportedStageProject(data) {
        const project = data && data.project ? data.project : data;
        if (!project || typeof project !== 'object') {
            throw new Error('Файл не похож на проект FEG Stage PRO');
        }
        if (!Array.isArray(project.shape)) {
            throw new Error('В файле проекта нет схемы сцены');
        }
        return {
            ...project,
            id: project.id || Date.now(),
            date: project.date || new Date().toISOString()
        };
    }

    function buildTrussProjectExportPayload(project) {
        return {
            type: 'feg-stage-pro-truss-export',
            exportedAt: new Date().toISOString(),
            project
        };
    }

    function normalizeImportedTrussProject(data) {
        const project = data && data.project ? data.project : data;
        if (!project || typeof project !== 'object') {
            throw new Error('Файл не похож на ферменный проект FEG Stage PRO');
        }
        if (!Array.isArray(project.segmentsH) || !Array.isArray(project.segmentsV)) {
            throw new Error('Нет схемы ферм');
        }
        return project;
    }

    function saveStageOrderSnapshot(snapshot, options) {
        const opts = options || {};
        const orders = getStageOrders();
        let idx = -1;
        if (opts.matchId !== undefined && opts.matchId !== null) {
            idx = findProjectIndexById(orders, opts.matchId, { allowIndexFallback: !!opts.allowIndexFallback });
        }
        if (idx < 0) idx = findProjectIndex(orders, snapshot);

        let savedSnapshot = snapshot;
        if (idx >= 0) {
            savedSnapshot = {
                ...snapshot,
                createdAt: orders[idx].createdAt || orders[idx].date,
                updatedAt: snapshot.updatedAt || new Date().toISOString(),
                cloudId: orders[idx].cloudId || null,
                cloudUpdatedAt: orders[idx].cloudUpdatedAt || null
            };
            orders[idx] = savedSnapshot;
        } else {
            savedSnapshot = {
                ...snapshot,
                createdAt: snapshot.createdAt || snapshot.date
            };
            orders.unshift(savedSnapshot);
        }

        const limited = limitProjects(orders, opts.maxItems || 100);
        setStageOrders(limited);
        return {
            order: savedSnapshot,
            orders: limited,
            index: idx,
            isUpdate: idx >= 0
        };
    }

    function replaceStageOrderSnapshot(referenceOrder, savedOrder, options) {
        const opts = options || {};
        const orders = getStageOrders();
        let idx = findProjectIndex(orders, referenceOrder);
        if (idx < 0 && referenceOrder) {
            idx = findProjectIndexById(orders, referenceOrder.id || referenceOrder._id, { allowIndexFallback: !!opts.allowIndexFallback });
        }
        if (idx >= 0) orders[idx] = savedOrder;
        else if (opts.insertIfMissing) orders.unshift(savedOrder);
        const limited = limitProjects(orders, opts.maxItems || 100);
        setStageOrders(limited);
        return {
            orders: limited,
            index: idx,
            wasReplaced: idx >= 0
        };
    }

    function deleteStageOrderById(idRaw, options) {
        const opts = options || {};
        const current = getStageOrders();
        let next = current.filter(order => String(order.id || order._id) !== String(idRaw));
        if (next.length === current.length && opts.allowIndexFallback) {
            const idx = parseInt(idRaw, 10);
            if (!Number.isNaN(idx) && current[idx]) {
                next = current.slice();
                next.splice(idx, 1);
            }
        }
        setStageOrders(next);
        return next;
    }

    function saveTrussProjectSnapshot(snapshot, options) {
        const opts = options || {};
        const projects = getTrussProjects();
        const idx = findProjectIndex(projects, snapshot);
        let savedSnapshot = snapshot;
        if (idx >= 0) {
            savedSnapshot = {
                ...snapshot,
                createdAt: projects[idx].createdAt || projects[idx].date,
                cloudId: projects[idx].cloudId || null
            };
            projects[idx] = savedSnapshot;
        } else {
            savedSnapshot = {
                ...snapshot,
                createdAt: snapshot.createdAt || snapshot.date
            };
            projects.unshift(savedSnapshot);
        }
        setTrussProjects(limitProjects(projects, opts.maxItems || 100));
        return savedSnapshot;
    }

    function deleteTrussProjectById(idRaw) {
        const current = getTrussProjects();
        const filtered = current.filter(project => String(project.id || project._id) !== String(idRaw));
        setTrussProjects(filtered);
        return filtered;
    }

    const api = {
        MODULE_NAME: 'ProjectStorage',
        MODULE_STATUS: 'runtime-extracted',
        STORAGE_KEYS,
        safeParseList,
        writeList,
        getProjects,
        setProjects,
        getStageOrders,
        setStageOrders,
        getTrussProjects,
        setTrussProjects,
        findProjectIndex,
        findProjectById,
        findProjectIndexById,
        findStageOrderById,
        findTrussProjectById,
        limitProjects,
        countByClient,
        safeFileNamePart,
        downloadJson,
        buildStageProjectExportPayload,
        normalizeImportedStageProject,
        buildTrussProjectExportPayload,
        normalizeImportedTrussProject,
        saveStageOrderSnapshot,
        replaceStageOrderSnapshot,
        deleteStageOrderById,
        saveTrussProjectSnapshot,
        deleteTrussProjectById
    };

    global.FEGModules = global.FEGModules || {};
    global.FEGModules.ProjectStorage = api;
})(typeof window !== 'undefined' ? window : globalThis);
