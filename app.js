// 应用状态管理
const App = {
    currentView: 'home',
    currentArticle: null,
    currentProjectCategory: null,
    articles: [],
    projects: [],
    
    // 初始化应用
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderHome();
    },
    
    // 加载数据
    async loadData() {
        try {
            const basePath = this.getBasePath();
            
            const [articlesRes, projectsRes] = await Promise.all([
                fetch(basePath + 'data/articles.json'),
                fetch(basePath + 'data/projects.json')
            ]);
            
            if (!articlesRes.ok || !projectsRes.ok) {
                throw new Error('数据加载失败');
            }
            
            this.articles = await articlesRes.json();
            this.projects = await projectsRes.json();
            
            // 按日期排序文章（最新的在前）
            this.articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('加载数据失败:', error);
            alert('数据加载失败，请刷新页面重试');
        }
    },
    
    // 获取基础路径（适配 GitHub Pages）
    getBasePath() {
        const path = window.location.pathname;
        if (path.includes('/AkirinShu.github.io/')) {
            return '/AkirinShu.github.io/';
        } else if (path === '/' || path === '') {
            return './';
        }
        return './';
    },
    
    // 设置事件监听
    setupEventListeners() {
        // 导航点击
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
        
        // 返回按钮
        document.getElementById('back-to-list').addEventListener('click', () => {
            this.switchView('articles');
        });
    },
    
    // 切换视图
    switchView(viewName) {
        this.currentView = viewName;
        
        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewName);
        });
        
        // 隐藏所有视图
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        // 显示目标视图
        if (viewName === 'home') {
            document.getElementById('home-view').classList.add('active');
            this.renderHome();
        } else if (viewName === 'articles') {
            document.getElementById('articles-view').classList.add('active');
            this.renderArticlesList();
        } else if (viewName === 'projects') {
            document.getElementById('projects-view').classList.add('active');
            this.renderProjectsView();
        } else if (viewName === 'article') {
            document.getElementById('article-view').classList.add('active');
        }
    },
    
    // 渲染首页
    renderHome() {
        // 最新文章（最多 5 篇）
        const latestArticles = this.articles.slice(0, 5);
        const latestArticlesContainer = document.getElementById('latest-articles');
        latestArticlesContainer.innerHTML = latestArticles.map(article => this.createArticleCard(article)).join('');
        
        // 最新项目（最多 6 个）
        const latestProjects = this.projects.slice(0, 6);
        const latestProjectsContainer = document.getElementById('latest-projects');
        latestProjectsContainer.innerHTML = latestProjects.map(project => this.createProjectCard(project)).join('');
    },
    
    // 渲染文章列表
    renderArticlesList() {
        const container = document.getElementById('all-articles');
        container.innerHTML = this.articles.map(article => this.createArticleCard(article)).join('');
    },
    
    // 创建文章卡片 HTML
    createArticleCard(article) {
        return `
            <div class="article-card">
                <h3><a href="#" onclick="App.showArticle('${article.id}'); return false;">${article.title}</a></h3>
                <div class="meta">${article.date} · ${article.category || '未分类'}</div>
                <div class="excerpt">${article.excerpt || ''}</div>
            </div>
        `;
    },
    
    // 创建项目卡片 HTML
    createProjectCard(project) {
        const tagsHtml = (project.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
        return `
            <div class="project-card">
                <h3>${project.name}</h3>
                <div class="description">${project.description || ''}</div>
                <div class="tags">${tagsHtml}</div>
            </div>
        `;
    },
    
    // 渲染项目视图
    renderProjectsView() {
        const categoriesContainer = document.getElementById('project-categories');
        const detailContainer = document.getElementById('project-detail');
        
        // 生成分类列表
        const categories = [...new Set(this.projects.map(p => p.category || '其他'))];
        
        categoriesContainer.innerHTML = categories.map((cat, index) => `
            <div class="category-item ${index === 0 ? 'active' : ''}" data-category="${cat}">
                ${cat}
            </div>
        `).join('');
        
        // 添加分类点击事件
        categoriesContainer.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                categoriesContainer.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.renderProjectDetail(item.dataset.category);
            });
        });
        
        // 默认显示第一个分类
        if (categories.length > 0) {
            this.renderProjectDetail(categories[0]);
        }
    },
    
    // 渲染项目详情
    renderProjectDetail(category) {
        const detailContainer = document.getElementById('project-detail');
        const projectsInCategory = this.projects.filter(p => (p.category || '其他') === category);
        
        if (projectsInCategory.length === 0) {
            detailContainer.innerHTML = '<p>该分类下暂无项目</p>';
            return;
        }
        
        detailContainer.innerHTML = `
            <h3 class="section-title">${category}</h3>
            <div class="project-list">
                ${projectsInCategory.map(p => this.createProjectCard(p)).join('')}
            </div>
        `;
    },
    
    // 显示文章
    async showArticle(articleId) {
        const article = this.articles.find(a => a.id === articleId);
        if (!article) {
            alert('文章不存在');
            return;
        }
        
        this.currentArticle = article;
        
        try {
            const basePath = this.getBasePath();
            const response = await fetch(basePath + article.path);
            
            if (!response.ok) {
                throw new Error('文章加载失败');
            }
            
            const markdownText = await response.text();
            const htmlContent = this.parseMarkdown(markdownText);
            
            document.getElementById('article-content').innerHTML = htmlContent;
            this.switchView('article');
        } catch (error) {
            console.error('加载文章失败:', error);
            alert('文章加载失败，请稍后重试');
        }
    },
    
    // 简易 Markdown 解析器
    parseMarkdown(text) {
        let html = text;
        
        // 转义 HTML
        html = html.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');
        
        // 标题
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // 粗体和斜体
        html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
        
        // 代码块
        html = html.replace(/```(\w*)\n([\s\S]*?)\n```/gim, '<pre><code class="language-$1">$2</code></pre>');
        html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
        
        // 引用
        html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
        
        // 链接
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>');
        
        // 图片
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1">');
        
        // 列表
        html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // 段落
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        // 清理多余的标签
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        html = html.replace(/<p>(<blockquote>)/g, '$1');
        html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
        
        return html;
    }
};

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
