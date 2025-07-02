// login.js
const auth = require('../../utils/auth.js');

Page({
  data: {
    phone: '',
    password: '',
    showPassword: false,
    loading: false,
    // 表单验证
    phoneError: '',
    passwordError: ''
  },

  onLoad() {
    // 如果已经登录，直接跳转到首页
    if (auth.isLoggedIn()) {
      wx.reLaunch({
        url: '/pages/index/index'
      });
    }
  },

  // 手机号输入
  onPhoneInput(e) {
    const phone = e.detail.value;
    this.setData({
      phone,
      phoneError: ''
    });
  },

  // 密码输入
  onPasswordInput(e) {
    const password = e.detail.value;
    this.setData({
      password,
      passwordError: ''
    });
  },

  // 切换密码显示/隐藏
  togglePasswordVisibility() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },

  // 表单验证
  validateForm() {
    let isValid = true;
    const { phone, password } = this.data;

    // 验证手机号
    if (!phone) {
      this.setData({ phoneError: '请输入手机号' });
      isValid = false;
    } else if (!/^1[3-9]\d{9}$/.test(phone)) {
      this.setData({ phoneError: '请输入正确的手机号' });
      isValid = false;
    }

    // 验证密码
    if (!password) {
      this.setData({ passwordError: '请输入密码' });
      isValid = false;
    } else if (password.length < 6) {
      this.setData({ passwordError: '密码长度不能少于6位' });
      isValid = false;
    }

    return isValid;
  },

  // 登录
  async handleLogin() {
    if (!this.validateForm()) {
      return;
    }

    const { phone, password } = this.data;

    this.setData({ loading: true });

    try {
      await auth.login(phone, password);
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      // 登录成功后跳转到首页
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/index/index'
        });
      }, 1500);

    } catch (error) {
      console.error('Login failed:', error);
      
      let errorMessage = '登录失败';
      if (error.message) {
        errorMessage = error.message;
      }

      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 忘记密码
  handleForgotPassword() {
    wx.showToast({
      title: '请联系管理员重置密码',
      icon: 'none',
      duration: 3000
    });
  },

  // 快速填入测试账号（开发环境使用）
  fillTestAccount() {
    this.setData({
      phone: '18910483472',
      password: '7gFw43LQPiEFE3t',
      phoneError: '',
      passwordError: ''
    });

    wx.showToast({
      title: '已填入测试账号',
      icon: 'success',
      duration: 1500
    });
  }
});
