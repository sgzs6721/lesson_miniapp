// 认证工具类
const api = require('./api.js');

/**
 * 检查用户是否已登录
 */
function isLoggedIn() {
  const token = wx.getStorageSync('token');
  const userInfo = wx.getStorageSync('userInfo');
  return !!(token && userInfo);
}

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
  return wx.getStorageSync('userInfo');
}

/**
 * 获取当前token
 */
function getToken() {
  return wx.getStorageSync('token');
}

/**
 * 保存登录信息
 * @param {string} token 访问令牌
 * @param {Object} userInfo 用户信息
 */
function saveLoginInfo(token, userInfo) {
  wx.setStorageSync('token', token);
  wx.setStorageSync('userInfo', userInfo);
}

/**
 * 清除登录信息
 */
function clearLoginInfo() {
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
}

/**
 * 用户登录
 * @param {string} phone 手机号
 * @param {string} password 密码
 */
function login(phone, password) {
  return new Promise((resolve, reject) => {
    api.login(phone, password)
      .then(response => {
        console.log('Login response:', response);

        // 根据实际API响应结构处理登录信息
        // API返回格式: { code: 200, message: "操作成功", data: { userId, phone, realName, roleId, roleName, institutionId, campusId, token } }
        if (response.code === 200) {
          const { data } = response;
          const token = data.token;

          if (token) {
            // 构造用户信息对象
            const userInfo = {
              userId: data.userId,
              phone: data.phone,
              realName: data.realName,
              name: data.realName, // 用于显示的名称
              roleId: data.roleId,
              roleName: data.roleName,
              institutionId: data.institutionId,
              campusId: data.campusId
            };

            saveLoginInfo(token, userInfo);
            resolve({ token, userInfo });
          } else {
            reject(new Error('登录响应中未找到token'));
          }
        } else {
          reject(new Error(response.message || '登录失败'));
        }
      })
      .catch(error => {
        console.error('Login error:', error);
        reject(error);
      });
  });
}

/**
 * 用户登出
 */
function logout() {
  return new Promise((resolve, reject) => {
    // 先调用API登出
    api.logout()
      .then(() => {
        clearLoginInfo();
        resolve();
      })
      .catch(error => {
        // 即使API调用失败，也清除本地存储
        console.warn('Logout API failed, but clearing local storage:', error);
        clearLoginInfo();
        resolve();
      });
  });
}

/**
 * 检查登录状态并跳转
 */
function checkLoginAndRedirect() {
  if (!isLoggedIn()) {
    wx.reLaunch({
      url: '/pages/login/login'
    });
    return false;
  }
  return true;
}

module.exports = {
  isLoggedIn,
  getCurrentUser,
  getToken,
  saveLoginInfo,
  clearLoginInfo,
  login,
  logout,
  checkLoginAndRedirect
};
