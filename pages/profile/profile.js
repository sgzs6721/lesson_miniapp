// profile.js
Page({
  data: {
    userInfo: {
      name: '管理员',
      avatar: '/images/default-avatar.png'
    }
  },
  onLoad() {
    // 页面加载时执行
  },
  onShow() {
    // 页面显示时执行
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 4 // 设置底部导航选中项
      })
    }
  },
  // 导航到对应页面
  navigateTo(e) {
    const page = e.currentTarget.dataset.page;
    
    // 根据不同的页面类型导航到不同的页面
    switch (page) {
      case 'campus':
        wx.navigateTo({
          url: '/pages/profile/campus/campus'
        });
        break;
      case 'coach':
        wx.navigateTo({
          url: '/pages/profile/coach/coach'
        });
        break;
      case 'user':
        wx.navigateTo({
          url: '/pages/profile/user/user'
        });
        break;
      case 'settings':
        wx.navigateTo({
          url: '/pages/profile/settings/settings'
        });
        break;
      case 'analysis':
        wx.navigateTo({
          url: '/pages/profile/analysis/analysis'
        });
        break;
      default:
        break;
    }
  }
}) 