// index.js
// 获取应用实例
const app = getApp()
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
      id: 1,
      name: '总校区'
    },
    campusList: [
      { id: 1, name: '总校区' },
      { id: 2, name: '东城校区' },
      { id: 3, name: '西城校区' },
      { id: 4, name: '南城校区' },
      { id: 5, name: '北城校区' }
    ],
    showCampusSelector: false,
    
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
      { id: 'addStudent', name: '添加学员', icon: 'icon-student' },
      { id: 'attendance', name: '课程签到', icon: 'icon-attendance' },
      { id: 'payment', name: '缴费登记', icon: 'icon-payment' },
      { id: 'report', name: '数据报表', icon: 'icon-report' }
    ]
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
      // 组件加载时获取初始数据
      this.loadCampusData(this.data.currentCampus.id);
    }
  },
}) 