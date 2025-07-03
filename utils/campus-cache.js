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
      throw new Error(response.message || '获取校区列表失败');
    }
  } catch (error) {
    console.error('Get campus list error:', error);
    
    // 如果网络请求失败，尝试从本地存储获取
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
    
    throw error;
  }
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
 * 清除校区缓存
 */
function clearCampusCache() {
  campusCache = null;
  cacheTimestamp = null;
  wx.removeStorageSync('campusCache');
}

/**
 * 初始化校区缓存（在登录后调用）
 */
async function initCampusCache() {
  try {
    await getCampusList(true); // 强制刷新
    console.log('Campus cache initialized');
  } catch (error) {
    console.error('Init campus cache error:', error);
  }
}

module.exports = {
  getCampusList,
  getCampusNameById,
  getCampusIdByName,
  clearCampusCache,
  initCampusCache
};
