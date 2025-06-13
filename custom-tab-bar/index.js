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
  methods: {
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