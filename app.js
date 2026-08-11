// 简单的 Markdown 解析器（原生 JS 实现）
class MarkdownParser {
    static parse(markdown) {
        let html = markdown;

        // 转义 HTML 特殊字符
        html = html.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');

        // 代码块（```code```）
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
        });

        // 行内代码（`code`）
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // 标题（# 到 ######）
        html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
        html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
        html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

        // 粗体（**text**）
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // 斜体（*text*）
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // 链接（[text](url)）
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

        // 图片（![alt](url)）
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

        // 引用（> text）
        html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');

        // 无序列表（- 或 * 开头）
        html = html.replace(/^[\-\*] (.*$)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
            return `<ul>${match}</ul>`;
        });

        // 有序列表（数字. 开头）
        html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');

        // 水平线（---）
        html = html.replace(/^---$/gm, '<hr>');

        // 段落（连续的非空行）
        html = html.replace(/\n\n+/g, '</p><p>');
        html = '<p>' + html + '</p>';

        // 清理多余的标签
        html = html.replace(/<p>\s*<(h[1-6]|ul|ol|li|blockquote|pre|hr)/g, '<$1');
        html = html.replace(/<(\/h[1-6]|\/ul|\/ol|\/blockquote|\/pre|hr)>\s*<\/p>/g, '$1>');
        html = html.replace(/<p>\s*<\/p>/g, '');

        return html;
    }
}

// 博客数据管理
class BlogApp {
    constructor() {
        this.articles = [];
        this.projects = [];
        this.folders = [];
        this.currentSection = 'articles';
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderArticlesList();
        this.renderResearchContent();
    }

    // 加载数据
    async loadData() {
        try {
            // 加载文章列表
            const articlesResponse = await fetch('data/articles.json');
            if (articlesResponse.ok) {
                this.articles = await articlesResponse.json();
            }

            // 加载项目数据
            const projectsResponse = await fetch('data/projects.json');
            if (projectsResponse.ok) {
                this.projects = await projectsResponse.json();
            }

            // 加载文件夹结构
            const foldersResponse = await fetch('data/folders.json');
            if (foldersResponse.ok) {
                this.folders = await foldersResponse.json();
            }
        } catch (error) {
            console.log('使用默认数据:', error);
            this.loadDefaultData();
        }
    }

    // 加载默认数据（当 JSON 文件不存在时）
    loadDefaultData() {
        this.articles = [
            {
                id: 1,
                title: '欢迎来到我的博客',
                date: '2025-01-01',
                tags: ['欢迎', '介绍'],
                excerpt: '这是我的第一篇博客文章，介绍一下这个博客的用途和规划。',
                file: 'articles/welcome.md'
            },
            {
                id: 2,
                title: '如何学习编程',
                date: '2025-01-02',
                tags: ['编程', '学习'],
                excerpt: '分享一些我学习编程的经验和方法，希望能对大家有所帮助。',
                file: 'articles/learn-programming.md'
            }
        ];

        this.projects = [
            {
                id: 1,
                name: '博客系统',
                description: '使用原生 HTML/CSS/JS 构建的静态博客系统，支持 Markdown 渲染。',
                status: '进行中',
                articles: [1, 2]
            },
            {
                id: 2,
                name: '笔记应用研究',
                description: '研究现代笔记软件的组织方式和交互设计。',
                status: '规划中',
                articles: []
            }
        ];

        this.folders = [
            {
                name: '技术文章',
                type: 'folder',
                children: [
                    { name: 'Web 开发', type: 'folder', children: [
                        { name: 'HTML 基础', type: 'file', articleId: 1 },
                        { name: 'CSS 技巧', type: 'file', articleId: null }
                    ]},
                    { name: '编程语言', type: 'folder', children: [
                        { name: 'JavaScript 入门', type: 'file', articleId: 2 }
                    ]}
                ]
            },
            {
                name: '生活随笔',
                type: 'folder',
                children: []
            }
        ];
    }

    // 设置事件监听
    setupEventListeners() {
        // 导航菜单切换
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });

        // 研究区视图切换
        document.querySelectorAll('.research-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchResearchView(view);
            });
        });

        // 返回列表按钮
        document.getElementById('back-to-list').addEventListener('click', () => {
            this.showArticlesList();
        });
    }

    // 切换主_section
    switchSection(section) {
        this.currentSection = section;

        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // 切换显示区域
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });

        if (section === 'articles') {
            document.getElementById('articles-section').classList.add('active');
            this.showArticlesList();
        } else if (section === 'research') {
            document.getElementById('research-section').classList.add('active');
        }
    }

    // 切换研究区视图
    switchResearchView(view) {
        document.querySelectorAll('.research-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        this.renderResearchContent();
    }

    // 渲染文章列表
    renderArticlesList() {
        const container = document.getElementById('articles-list');
        if (!container || this.articles.length === 0) return;

        container.innerHTML = this.articles.map(article => `
            <div class="article-card" data-id="${article.id}">
                <h3>${article.title}</h3>
                <div class="meta">📅 ${article.date}</div>
                <div class="excerpt">${article.excerpt}</div>
                <div class="tags">
                    ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `).join('');

        // 添加点击事件
        container.querySelectorAll('.article-card').forEach(card => {
            card.addEventListener('click', () => {
                const articleId = parseInt(card.dataset.id);
                this.showArticle(articleId);
            });
        });
    }

    // 显示文章列表
    showArticlesList() {
        document.getElementById('articles-section').classList.add('active');
        document.getElementById('article-view').classList.remove('active');
    }

    // 显示单篇文章
    async showArticle(articleId) {
        const article = this.articles.find(a => a.id === articleId);
        if (!article) return;

        document.getElementById('articles-section').classList.remove('active');
        document.getElementById('article-view').classList.add('active');

        const contentContainer = document.getElementById('article-content');
        contentContainer.innerHTML = '<p>加载中...</p>';

        try {
            const response = await fetch(article.file);
            if (response.ok) {
                const markdown = await response.text();
                const html = MarkdownParser.parse(markdown);
                contentContainer.innerHTML = `
                    <h1>${article.title}</h1>
                    <div class="article-meta">
                        📅 ${article.date} · 
                        🏷️ ${article.tags.join(', ')}
                    </div>
                    ${html}
                `;
            } else {
                contentContainer.innerHTML = `
                    <h1>${article.title}</h1>
                    <div class="article-meta">📅 ${article.date}</div>
                    <p>文章内容加载中...</p>
                `;
            }
        } catch (error) {
            contentContainer.innerHTML = `
                <h1>${article.title}</h1>
                <div class="article-meta">📅 ${article.date}</div>
                <p>文章加载失败，请稍后重试。</p>
            `;
        }
    }

    // 渲染研究区内容
    renderResearchContent() {
        const activeBtn = document.querySelector('.research-btn.active');
        const view = activeBtn ? activeBtn.dataset.view : 'projects';
        const container = document.getElementById('research-content');

        if (view === 'projects') {
            this.renderProjectsView(container);
        } else {
            this.renderFoldersView(container);
        }
    }

    // 渲染项目视图
    renderProjectsView(container) {
        if (this.projects.length === 0) {
            container.innerHTML = '<p>暂无项目</p>';
            return;
        }

        container.innerHTML = `
            <div class="project-grid">
                ${this.projects.map(project => `
                    <div class="project-card">
                        <h3>${project.name}</h3>
                        <p>${project.description}</p>
                        <div class="project-meta">
                            状态：${project.status} · 
                            相关文章：${project.articles.length}篇
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 渲染文件夹视图
    renderFoldersView(container) {
        if (this.folders.length === 0) {
            container.innerHTML = '<p>暂无文件夹</p>';
            return;
        }

        const renderFolderTree = (items, level = 0) => {
            return items.map(item => {
                if (item.type === 'folder') {
                    const childrenHtml = item.children && item.children.length > 0
                        ? `<div class="folder-children">${renderFolderTree(item.children, level + 1)}</div>`
                        : '';
                    return `
                        <div class="folder-item">
                            <span class="folder-icon">📁</span>
                            <span>${item.name}</span>
                        </div>
                        ${childrenHtml}
                    `;
                } else {
                    return `
                        <div class="folder-item" data-article="${item.articleId || ''}">
                            <span class="file-icon">📄</span>
                            <span>${item.name}</span>
                        </div>
                    `;
                }
            }).join('');
        };

        container.innerHTML = `
            <div class="folder-tree">
                ${renderFolderTree(this.folders)}
            </div>
        `;

        // 添加文件夹点击事件
        container.querySelectorAll('.folder-item[data-article]').forEach(item => {
            item.addEventListener('click', () => {
                const articleId = parseInt(item.dataset.article);
                if (articleId) {
                    this.switchSection('articles');
                    setTimeout(() => this.showArticle(articleId), 100);
                }
            });
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.blogApp = new BlogApp();
});
