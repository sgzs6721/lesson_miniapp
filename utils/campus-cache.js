// 校区缓存工具类
const api = require('./api.js');

let campusCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 获取校区列表（带缓存）
 * @param {boolean} forceRefresh 是否强制刷新
 */
async function getCampusList(forceRefresh = false) {
  const now = Date.now();

  // 检查缓存是否有效
  if (!forceRefresh && campusCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
    return campusCache;
  }

  try {
    // 获取所有校区数据（使用较大的pageSize）
    const response = await api.getCampusList(1, 100);

    if (response.code === 200) {
      campusCache = response.data.list || [];
      cacheTimestamp = now;

      // 同时保存到本地存储
      wx.setStorageSync('campusCache', {
        data: campusCache,
        timestamp: cacheTimestamp
      });

      return campusCache;
    } else {
      // API返回错误，尝试从本地存储获取
      console.error('API error:', response.message || '获取校区列表失败');
    }
  } catch (error) {
    console.error('Get campus list error:', error);
  }

  // 如果API失败，尝试从本地存储获取
  try {
    const localCache = wx.getStorageSync('campusCache');
    if (localCache && localCache.data) {
      campusCache = localCache.data;
      cacheTimestamp = localCache.timestamp;
      return campusCache;
    }
  } catch (storageError) {
    console.error('Get local campus cache error:', storageError);
  }

  // 如果都失败了，返回空数组
  return [];
}

/**
 * 根据校区ID获取校区名称
 * @param {number} campusId 校区ID
 */
async function getCampusNameById(campusId) {
  if (!campusId) return '全部校区';

  try {
    const campusList = await getCampusList();
    const campus = campusList.find(c => c.id === campusId);
    return campus ? campus.name : '未知校区';
  } catch (error) {
    console.error('Get campus name error:', error);
    return '未知校区';
  }
}

/**
 * 根据校区名称获取校区ID
 * @param {string} campusName 校区名称
 */
async function getCampusIdByName(campusName) {
  if (!campusName || campusName === '全部校区') return null;

  try {
    const campusList = await getCampusList();
    const campus = campusList.find(c => c.name === campusName);
    return campus ? campus.id : null;
  } catch (error) {
    console.error('Get campus id error:', error);
    return null;
  }
}

/**
 * 获取当前选中的校区
 */
function getCurrentCampus() {
  try {
    return wx.getStorageSync('currentCampus') || null;
  } catch (error) {
    console.error('Get current campus error:', error);
    return null;
  }
}

/**
 * 设置当前选中的校区
 * @param {Object} campus 校区对象 {id, name, status, ...}
 */
function setCurrentCampus(campus) {
  try {
    wx.setStorageSync('currentCampus', campus);
    console.log('Current campus set to:', campus);
  } catch (error) {
    console.error('Set current campus error:', error);
  }
}

/**
 * 获取第一个营业中的校区
 * @param {Array} campusList 校区列表
 */
function getFirstOperatingCampus(campusList) {
  if (!campusList || campusList.length === 0) return null;

  // 查找第一个状态为 OPERATING 的校区
  const operatingCampus = campusList.find(campus => campus.status === 'OPERATING');

  // 如果没有营业中的校区，返回第一个校区
  return operatingCampus || campusList[0];
}

/**
 * 初始化校区缓存和选择（在登录后调用）
 */
async function initCampusCache() {
  try {
    // 强制刷新校区列表
    const campusList = await getCampusList(true);
    console.log('Campus cache initialized, campus count:', campusList.length);

    // 检查是否已有选中的校区
    let currentCampus = getCurrentCampus();

    // 如果没有选中的校区，或者选中的校区不在列表中，自动选择第一个营业中的校区
    if (!currentCampus || !campusList.find(c => c.id === currentCampus.id)) {
      const defaultCampus = getFirstOperatingCampus(campusList);
      if (defaultCampus) {
        setCurrentCampus(defaultCampus);
        currentCampus = defaultCampus;
        console.log('Auto selected default campus:', defaultCampus.name);
      }
    }

    return currentCampus;
  } catch (error) {
    console.error('Init campus cache error:', error);
    throw error;
  }
}

/**
 * 清除校区缓存和选择
 */
function clearCampusCache() {
  campusCache = null;
  cacheTimestamp = null;
  wx.removeStorageSync('campusCache');
  wx.removeStorageSync('currentCampus');
}

module.exports = {
  getCampusList,
  getCampusNameById,
  getCampusIdByName,
  getCurrentCampus,
  setCurrentCampus,
  getFirstOperatingCampus,
  clearCampusCache,
  initCampusCache
};
