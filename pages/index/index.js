// index.js
// 获取应用实例
const app = getApp()
const auth = require('../../utils/auth.js')
const campusCache = require('../../utils/campus-cache.js')
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Component({
  data: {
    motto: 'Hello World',
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    // 校区相关
    currentCampus: {
      id: null,
      name: '请选择校区'
    },
    campusList: [],
    showCampusSelector: false,
    campusDataLoaded: false, // 标记校区数据是否已加载
    
    // 统计数据
    stats: {
      teacherCount: 0,
      classCount: 0,
      studentCount: 0,
      checkinCount: 0,
      consumedHours: 0,
      leaveCount: 0,
      teacherSalary: 0,
      consumedFees: 0
    },
    
    // 今日上课学员
    todayStudents: [],
    
    // 今日课表
    scheduleList: [
      { 
        id: 1, 
        startTime: '09:00', 
        endTime: '10:30', 
        courseName: '少儿游泳初级班', 
        teacherName: '王教练', 
        roomName: '泳池A', 
        studentCount: 12 
      },
      { 
        id: 2, 
        startTime: '10:45', 
        endTime: '12:15', 
        courseName: '成人游泳提高班', 
        teacherName: '李教练', 
        roomName: '泳池B', 
        studentCount: 8 
      },
      { 
        id: 3, 
        startTime: '14:00', 
        endTime: '15:30', 
        courseName: '青少年篮球班', 
        teacherName: '赵教练', 
        roomName: '篮球馆', 
        studentCount: 15 
      }
    ],
    
    // 快捷功能
    quickActions: [
      { id: 'addStudent', name: '添加学员', icon: 'add-student' },
      { id: 'checkin', name: '课程签到', icon: 'checkin' },
      { id: 'payment', name: '缴费登记', icon: 'payment' },
      { id: 'report', name: '数据报表', icon: 'report' }
    ],
    currentDate: '',
  },
  pageLifetimes: {
    show: async function() {
      // 检查登录状态
      if (!auth.checkLoginAndRedirect()) {
        return;
      }

      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 0
        });
      }

      // 只在首次显示时加载校区数据
      if (!this.data.campusDataLoaded) {
        try {
          await this.loadCampusListDirectly();
        } catch (error) {
          console.error('校区数据加载失败', error);
        }
      }
    }
  },
  methods: {
    // 事件处理函数
    bindViewTap() {
      wx.navigateTo({
        url: '../logs/logs',
      })
    },
    onChooseAvatar(e) {
      const { avatarUrl } = e.detail
      const { nickName } = this.data.userInfo
      this.setData({
        "userInfo.avatarUrl": avatarUrl,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      })
    },
    onInputChange(e) {
      const nickName = e.detail.value
      const { avatarUrl } = this.data.userInfo
      this.setData({
        "userInfo.nickName": nickName,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      })
    },
    getUserProfile() {
      // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
      wx.getUserProfile({
        desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
        success: (res) => {
          console.log(res)
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    },
    // 校区选择相关
    showCampusSelector() {
      // 如果校区列表为空且未加载过，直接从API加载
      if ((!this.data.campusList || this.data.campusList.length === 0) && !this.data.campusDataLoaded) {
        this.loadCampusListDirectly();
      }

      this.setData({
        showCampusSelector: true
      });
    },
    
    hideCampusSelector() {
      this.setData({
        showCampusSelector: false
      });
    },
    
    selectCampus(e) {
      const campusId = e.currentTarget.dataset.id;
      const campus = this.data.campusList.find(item => item.id === campusId);

      if (campus) {
        // 保存到全局校区选择
        const campusCache = require('../../utils/campus-cache.js');
        campusCache.setCurrentCampus(campus);

        this.setData({
          currentCampus: campus,
          showCampusSelector: false
        });

        // 切换校区后重新加载数据
        this.loadCampusData(campusId);
      }
    },

    // 加载校区数据
    loadCampusData(campusId) {
      wx.showLoading({
        title: '加载中'
      });
      
      // 模拟数据加载
      setTimeout(() => {
        // 模拟统计数据
        const stats = {
          teacherCount: Math.floor(Math.random() * 10) + 5,
          classCount: Math.floor(Math.random() * 8) + 3,
          studentCount: Math.floor(Math.random() * 50) + 20,
          checkinCount: Math.floor(Math.random() * 100) + 50,
          consumedHours: Math.floor(Math.random() * 20) + 10,
          leaveCount: Math.floor(Math.random() * 5),
          teacherSalary: Math.floor(Math.random() * 5000) + 2000,
          consumedFees: Math.floor(Math.random() * 10000) + 5000
        };
        
        // 模拟今日上课学员数据
        const todayStudents = [
          {
            id: 1,
            name: '张三',
            avatarUrl: '',
            className: '少儿游泳初级班',
            checkinTime: '08:45',
            status: 'checked',
            statusText: '已打卡'
          },
          {
            id: 2,
            name: '李四',
            avatarUrl: '',
            className: '成人游泳提高班',
            checkinTime: '',
            status: 'pending',
            statusText: '未打卡'
          },
          {
            id: 3,
            name: '王五',
            avatarUrl: '',
            className: '青少年篮球班',
            checkinTime: '09:00',
            status: 'leave',
            statusText: '请假'
          }
        ];
        
        this.setData({
          stats,
          todayStudents
        });
        
        wx.hideLoading();
      }, 500);
    },
    
    // 导航功能
    navigateToSchedule() {
      wx.navigateTo({
        url: '../course/course'
      });
    },
    
    navigateToStudents() {
      wx.navigateTo({
        url: '../student/student'
      });
    },
    
    // 快捷功能
    handleQuickAction(e) {
      const actionId = e.currentTarget.dataset.id;
      
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    },
    
    // 生命周期函数
    attached() {
      // 检查登录状态
      if (!auth.checkLoginAndRedirect()) {
        return;
      }

      this.setCurrentDate();
    },

    // 直接从API加载校区列表数据
    async loadCampusListDirectly() {
      // 如果已经加载过校区数据，直接返回
      if (this.data.campusDataLoaded) {
        return;
      }

      this.setData({
        campusDataLoaded: true
      });

      try {
        // 使用校区缓存工具初始化
        const campusCache = require('../../utils/campus-cache.js');
        const currentCampus = await campusCache.initCampusCache();

        // 获取校区列表
        const campusList = await campusCache.getCampusList();

        // 更新校区列表
        this.setData({
          campusList: campusList
        });

        // 设置当前校区
        if (currentCampus) {
          this.setData({
            currentCampus: currentCampus
          });

          // 加载校区相关数据
          this.loadCampusData(currentCampus.id);
        } else if (campusList.length > 0) {
          // 如果没有当前校区但有校区列表，选择第一个营业中的校区
          const firstOperating = campusCache.getFirstOperatingCampus(campusList);
          if (firstOperating) {
            campusCache.setCurrentCampus(firstOperating);
            this.setData({
              currentCampus: firstOperating
            });
            this.loadCampusData(firstOperating.id);
          }
        }
      } catch (error) {
        // 网络错误，重置标记以允许重试
        this.setData({
          campusDataLoaded: false
        });
        console.error('Load campus list error:', error);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    },

    // 选择合适的校区
    selectAppropiateCampus(campusList) {
      if (!campusList || campusList.length === 0) {
        return;
      }

      const campusCache = require('../../utils/campus-cache.js');
      const currentUser = auth.getCurrentUser();
      let selectedCampus = null;

      // 首先检查是否已有全局选中的校区
      const currentCampus = campusCache.getCurrentCampus();
      if (currentCampus && campusList.find(c => c.id === currentCampus.id)) {
        selectedCampus = currentCampus;
      }
      // 如果用户有指定校区，尝试找到对应的校区
      else if (currentUser && currentUser.campusId) {
        selectedCampus = campusList.find(c => c.id === currentUser.campusId);
      }
      // 如果没有找到，选择第一个营业中的校区
      else {
        selectedCampus = campusCache.getFirstOperatingCampus(campusList);
      }

      if (selectedCampus) {
        // 保存到全局校区选择
        campusCache.setCurrentCampus(selectedCampus);

        // 更新当前校区
        this.setData({
          currentCampus: selectedCampus
        });

        // 加载校区相关数据
        this.loadCampusData(selectedCampus.id);
      }
    },

    // 加载校区列表数据（从缓存，备用方法）
    async loadCampusListData() {
      // 如果已经加载过，直接返回
      if (this.data.campusDataLoaded) {
        return;
      }

      try {
        const campusList = await campusCache.getCampusList();

        if (campusList && campusList.length > 0) {
          this.setData({
            campusList: campusList,
            campusDataLoaded: true
          });

          this.selectAppropiateCampus(campusList);
        } else {
          // 如果缓存为空，直接从API加载
          await this.loadCampusListDirectly();
        }
      } catch (error) {
        // 缓存失败时直接从API加载
        await this.loadCampusListDirectly();
      }
    },
    setCurrentDate() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const weekday = weekdays[now.getDay()];
      
      this.setData({
        currentDate: `${year}年${month}月${day}日 ${weekday}`
      });
    }
  },
}) 
