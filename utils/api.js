// API 工具类
const BASE_URL = 'http://lesson.devtesting.top/lesson/api';

/**
 * 发起网络请求
 * @param {Object} options 请求配置
 * @param {string} options.url 请求地址
 * @param {string} options.method 请求方法，默认GET
 * @param {Object} options.data 请求数据
 * @param {Object} options.header 请求头
 * @param {boolean} options.needAuth 是否需要认证，默认false
 */
function request(options) {
  return new Promise((resolve, reject) => {
    // 构建完整URL
    const url = options.url.startsWith('http') ? options.url : BASE_URL + options.url;
    
    // 构建请求头
    let header = {
      'Content-Type': 'application/json',
      ...options.header
    };
    
    // 如果需要认证，添加token
    if (options.needAuth) {
      const token = wx.getStorageSync('token');
      if (token) {
        header['Authorization'] = token; // 直接使用token，不加Bearer前缀
      }
    }
    
    wx.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res) => {
        console.log('API Response:', res);
        
        // 处理HTTP状态码
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // 未授权，清除本地存储并跳转到登录页
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.reLaunch({
            url: '/pages/login/login'
          });
          reject(new Error('未授权，请重新登录'));
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('API Error:', err);
        reject(err);
      }
    });
  });
}

/**
 * 用户登录
 * @param {string} phone 手机号
 * @param {string} password 密码
 */
function login(phone, password) {
  return request({
    url: '/auth/login',
    method: 'POST',
    data: {
      phone,
      password
    }
  });
}

/**
 * 获取用户信息
 */
function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'GET',
    needAuth: true
  });
}

/**
 * 用户登出
 */
function logout() {
  return request({
    url: '/auth/logout',
    method: 'POST',
    needAuth: true
  });
}

/**
 * 获取校区列表
 * @param {number} pageNum 页码，默认1
 * @param {number} pageSize 每页数量，默认10
 */
function getCampusList(pageNum = 1, pageSize = 10) {
  return request({
    url: `/campus/list?pageNum=${pageNum}&pageSize=${pageSize}`,
    method: 'GET',
    needAuth: true
  });
}

/**
 * 获取校区详情
 * @param {number} campusId 校区ID
 */
function getCampusDetail(campusId) {
  return request({
    url: `/campus/detail?id=${campusId}`,
    method: 'GET',
    needAuth: true
  });
}

/**
 * 添加校区
 * @param {Object} campusData 校区数据
 */
function addCampus(campusData) {
  return request({
    url: '/campus/create',
    method: 'POST',
    data: campusData,
    needAuth: true
  });
}

/**
 * 更新校区
 * @param {Object} campusData 校区数据
 */
function updateCampus(campusData) {
  return request({
    url: '/campus/update',
    method: 'POST',
    data: campusData,
    needAuth: true
  });
}

/**
 * 删除校区
 * @param {number} campusId 校区ID
 */
function deleteCampus(campusId) {
  return request({
    url: `/campus/delete?id=${campusId}`,
    method: 'POST',
    needAuth: true
  });
}

/**
 * 获取用户列表
 * @param {number} pageNum 页码，默认1
 * @param {number} pageSize 每页数量，默认10
 */
function getUserList(pageNum = 1, pageSize = 10) {
  return request({
    url: `/user/list?pageNum=${pageNum}&pageSize=${pageSize}`,
    method: 'GET',
    needAuth: true
  });
}

/**
 * 创建用户
 * @param {Object} userData 用户数据
 */
function createUser(userData) {
  return request({
    url: '/user/create',
    method: 'POST',
    data: userData,
    needAuth: true
  });
}

/**
 * 更新用户
 * @param {Object} userData 用户数据
 */
function updateUser(userData) {
  return request({
    url: '/user/update',
    method: 'POST',
    data: userData,
    needAuth: true
  });
}

/**
 * 删除用户
 * @param {number} userId 用户ID
 */
function deleteUser(userId) {
  return request({
    url: `/user/delete?id=${userId}`,
    method: 'POST',
    needAuth: true
  });
}

/**
 * 获取教练列表
 * @param {number} pageNum 页码，默认1
 * @param {number} pageSize 每页数量，默认10
 * @param {number} campusId 校区ID，必需
 */
function getCoachList(pageNum = 1, pageSize = 10, campusId) {
  if (!campusId) {
    throw new Error('campusId is required for getCoachList');
  }

  const url = `/coach/list?pageNum=${pageNum}&pageSize=${pageSize}&campusId=${campusId}`;
  return request({
    url: url,
    method: 'GET',
    needAuth: true
  });
}

/**
 * 获取教练详情
 * @param {number} coachId 教练ID
 * @param {number} campusId 校区ID
 */
function getCoachDetail(coachId, campusId) {
  return request({
    url: `/coach/detail?id=${coachId}&campusId=${campusId}`,
    method: 'GET',
    needAuth: true
  });
}

/**
 * 创建教练
 * @param {Object} coachData 教练数据
 */
function createCoach(coachData) {
  return request({
    url: '/coach/create',
    method: 'POST',
    data: coachData,
    needAuth: true
  });
}

/**
 * 更新教练
 * @param {Object} coachData 教练数据
 */
function updateCoach(coachData) {
  return request({
    url: '/coach/update',
    method: 'POST',
    data: coachData,
    needAuth: true
  });
}

/**
 * 删除教练
 * @param {number} coachId 教练ID
 */
function deleteCoach(coachId) {
  return request({
    url: `/coach/delete?id=${coachId}`,
    method: 'POST',
    needAuth: true
  });
}

/**
 * 获取简单教练列表
 * @param {number} campusId 校区ID
 */
function getSimpleCoachList(campusId) {
  return request({
    url: `/coach/simple/list?campusId=${campusId}`,
    method: 'GET',
    needAuth: true
  });
}

/**
 * 获取课程列表
 * @param {number} page 页码，默认1
 * @param {number} pageSize 每页数量，默认10
 * @param {number} campusId 校区ID
 * @param {string} sortField 排序字段，默认createdTime
 * @param {string} sortOrder 排序方向，默认desc
 */
function getCourseList(page = 1, pageSize = 10, campusId, sortField = 'createdTime', sortOrder = 'desc') {
  return request({
    url: `/courses/list?page=${page}&pageSize=${pageSize}&sortField=${sortField}&sortOrder=${sortOrder}&campusId=${campusId}`,
    method: 'GET',
    needAuth: true
  });
}

/**
 * 获取常量列表
 * @param {string} type 常量类型
 */
function getConstantsList(type) {
  return request({
    url: `/constants/list?type=${type}`,
    method: 'GET',
    needAuth: true
  });
}

/**
 * 创建课程
 * @param {Object} courseData 课程数据
 */
function createCourse(courseData) {
  return request({
    url: '/courses/create',
    method: 'POST',
    data: courseData,
    needAuth: true
  });
}

/**
 * 更新课程
 * @param {Object} courseData 课程数据
 */
function updateCourse(courseData) {
  return request({
    url: '/courses/update',
    method: 'POST',
    data: courseData,
    needAuth: true
  });
}

/**
 * 删除课程
 * @param {string} courseId 课程ID
 */
function deleteCourse(courseId) {
  return request({
    url: `/courses/delete?id=${courseId}`,
    method: 'POST',
    needAuth: true
  });
}

/**
 * 获取简单课程列表（用于学员选择）
 * @param {string} campusId 校区ID
 */
function getSimpleCourseList(campusId) {
  return request({
    url: `/courses/simple?campusId=${campusId}`,
    method: 'GET',
    needAuth: true
  });
}

/**
 * 获取学员列表
 * @param {number} pageNum 页码
 * @param {number} pageSize 每页大小
 * @param {string} campusId 校区ID
 */
function getStudentList(pageNum, pageSize, campusId) {
  return request({
    url: `/student/list?campusId=${campusId}&pageNum=${pageNum}&pageSize=${pageSize}&sortField=id&sortOrder=desc`,
    method: 'GET',
    needAuth: true
  });
}

/**
 * 创建学员
 * @param {Object} studentData 学员数据
 */
function createStudent(studentData) {
  return request({
    url: '/student/create',
    method: 'POST',
    data: studentData,
    needAuth: true
  });
}

/**
 * 更新学员
 * @param {Object} studentData 学员数据
 */
function updateStudent(studentData) {
  return request({
    url: '/student/update',
    method: 'POST',
    data: studentData,
    needAuth: true
  });
}

/**
 * 删除学员
 * @param {string} studentId 学员ID
 */
function deleteStudent(studentId) {
  return request({
    url: `/student/delete?id=${studentId}`,
    method: 'POST',
    needAuth: true
  });
}

/**
 * 学员缴费记录
 * @param {Object} paymentData 缴费数据
 */
function createStudentPayment(paymentData) {
  return request({
    url: '/student/payment',
    method: 'POST',
    data: paymentData,
    needAuth: true
  });
}

/**
 * 获取赠品列表
 */
function getGiftItems() {
  return request({
    url: '/constants/list?type=GIFT_ITEM',
    method: 'GET',
    needAuth: true
  });
}

module.exports = {
  request,
  login,
  getUserInfo,
  logout,
  getCampusList,
  getCampusDetail,
  addCampus,
  updateCampus,
  deleteCampus,
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  getCoachList,
  getCoachDetail,
  createCoach,
  updateCoach,
  deleteCoach,
  getSimpleCoachList,
  getCourseList,
  getConstantsList,
  createCourse,
  updateCourse,
  deleteCourse,
  getSimpleCourseList,
  getStudentList,
  createStudent,
  updateStudent,
  deleteStudent,
  createStudentPayment,
  getGiftItems
};
