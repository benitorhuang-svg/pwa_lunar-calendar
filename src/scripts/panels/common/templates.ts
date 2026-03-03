/**
 * Common Panel Templates
 * 統一面板佈局 (Unified Panel Layouts)
 */

export const AtomicPageLayout = (sidebarHtml: string, contentHtml: string) => `
    <div class="panel-detail-body">
        ${sidebarHtml}
        <div class="panel-main-content">
            ${contentHtml}
        </div>
    </div>
`;
