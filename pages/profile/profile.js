// profile.js
const auth = require('../../utils/auth.js');

Page({
  data: {
    userInfo: {
      name: '管理员',
      avatar: '/images/default-avatar.png'
    }
  },
  onLoad() {
    // 页面加载时执行
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      this.setData({
        userInfo: {
          name: currentUser.realName || currentUser.name || '管理员',
          avatar: currentUser.avatar || '/images/default-avatar.png',
          phone: currentUser.phone,
          roleName: currentUser.roleName || '管理员'
        }
      });
    }
  },
  onShow() {
    // 页面显示时执行
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 4 // 个人中心页是第五个标签，索引为4
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
      case 'logout':
        this.handleLogout();
        break;
      default:
        break;
    }
  },

  // 处理登出
  handleLogout() {
    wx.showModal({
      title: '确认登出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '退出中...'
          });

          auth.logout()
            .then(() => {
              wx.hideLoading();
              wx.showToast({
                title: '已退出登录',
                icon: 'success'
              });

              // 跳转到登录页
              setTimeout(() => {
                wx.reLaunch({
                  url: '/pages/login/login'
                });
              }, 1500);
            })
            .catch((error) => {
              wx.hideLoading();
              console.error('Logout error:', error);
              wx.showToast({
                title: '退出失败',
                icon: 'none'
              });
            });
        }
      }
    });
  }
})
