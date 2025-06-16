Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        icon: "🏠"
      },
      {
        pagePath: "/pages/course/course",
        text: "课程",
        icon: "📚"
      },
      {
        pagePath: "/pages/student/student",
        text: "学员",
        icon: "👨‍🎓"
      },
      {
        pagePath: "/pages/finance/finance",
        text: "财务",
        icon: "💰"
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        icon: "👤"
      }
    ]
  },
  lifetimes: {
    attached: function() {
      // 在组件实例进入页面节点树时执行
      this.updateSelected();
    },
    ready: function() {
      // 在组件在视图层布局完成后执行
      this.updateSelected();
    }
  },
  pageLifetimes: {
    show: function() {
      // 页面被展示时执行
      this.updateSelected();
    }
  },
  methods: {
    updateSelected: function() {
      // 获取当前页面路径
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const route = '/' + currentPage.route;
      
      // 查找当前路径对应的tab索引
      const idx = this.data.list.findIndex(item => item.pagePath === route);
      if (idx !== -1 && idx !== this.data.selected) {
        this.setData({ selected: idx });
      }
    },
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({
        url
      });
      this.setData({
        selected: data.index
      });
    }
  }
}) 