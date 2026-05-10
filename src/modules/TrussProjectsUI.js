// FEG Stage PRO v3.7.0 — TrussProjectsUI module
// Responsibility: render saved 2D truss project list without owning project data.
// Classic-compatible module: attaches API to window.FEGModules.TrussProjectsUI.
(function (global) {
    'use strict';

    function fallbackEscape(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function fallbackMoney(value) {
        return `${Number(value || 0).toLocaleString('ru-RU')} ₽`;
    }

    function formatProjectDate(value) {
        const date = value ? new Date(value) : new Date();
        if (Number.isNaN(date.getTime())) return new Date().toLocaleDateString('ru-RU');
        return date.toLocaleDateString('ru-RU');
    }

    function projectTotal(project) {
        return project.total || (project.result && project.result.total) || 0;
    }

    function renderRows(projects, options) {
        const opts = options && typeof options === 'object' ? options : {};
        const escape = typeof opts.escapeHtml === 'function' ? opts.escapeHtml : fallbackEscape;
        const money = typeof opts.money === 'function' ? opts.money : fallbackMoney;
        return (Array.isArray(projects) ? projects : []).map((project, idx) => {
            const id = project.id;
            return `
            <tr>
                <td><strong>${project.orderId || ('TR-' + (project.id || idx))}${project.cloudId ? ' ☁' : ''}</strong></td>
                <td>${escape(project.client || '—')}</td>
                <td>${escape(project.name || '—')}</td>
                <td>${formatProjectDate(project.updatedAt || project.date || Date.now())}</td>
                <td><strong>${money(projectTotal(project))}</strong></td>
                <td><div class="truss-project-actions">
                    <button type="button" title="Открыть" onclick="openTrussProject('${id}')">✎</button>
                    <button type="button" title="Тех PDF" onclick="downloadSavedTrussPdf('${id}', 'tech')">PDF</button>
                    <button type="button" title="КП PDF" onclick="downloadSavedTrussPdf('${id}', 'client')">КП</button>
                    <button type="button" title="Облако" onclick="uploadSavedTrussToCloud('${id}')">☁</button>
                    <button type="button" title="Удалить" onclick="deleteTrussProject('${id}')">🗑</button>
                </div></td>
            </tr>`;
        }).join('');
    }

    function renderProjectsHtml(projects, options) {
        const list = Array.isArray(projects) ? projects : [];
        if (!list.length) return '<div class="orders-empty-state">Нет сохранённых ферменных проектов.</div>';
        const rows = renderRows(list, options);
        return `<div class="truss-project-table-wrap"><table class="truss-project-table"><thead><tr><th>ID</th><th>Клиент</th><th>Проект</th><th>Дата</th><th>Стоимость</th><th>Действия</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }

    function renderProjectsList(container, projects, options) {
        if (!container) return '';
        const html = renderProjectsHtml(projects, options);
        container.innerHTML = html;
        return html;
    }

    const api = {
        MODULE_NAME: 'TrussProjectsUI',
        MODULE_STATUS: 'runtime-extracted',
        fallbackEscape,
        fallbackMoney,
        formatProjectDate,
        projectTotal,
        renderRows,
        renderProjectsHtml,
        renderProjectsList
    };

    global.FEGModules = global.FEGModules || {};
    global.FEGModules.TrussProjectsUI = api;
})(typeof window !== 'undefined' ? window : globalThis);
