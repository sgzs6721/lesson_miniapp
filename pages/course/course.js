// course.js
const api = require('../../utils/api.js');
const auth = require('../../utils/auth.js');
const campusCache = require('../../utils/campus-cache.js');

Page({
  data: {
    activeTab: 'course',
    searchKey: '',
    courseList: [],
    loading: false,

    // 分页相关
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,

    // 校区相关
    selectedCampusId: null,

    // 弹窗相关
    showCourseModal: false,
    showDetailModal: false,
    editingCourse: null,
    currentCourse: null,

    // 表单数据
    courseForm: {
      name: '',
      typeId: null,
      typeIndex: 0,
      status: 'PUBLISHED',
      statusIndex: 0,
      coachIds: [],
      coachIndexes: [],
      unitHours: '1.0',
      price: '100',
      coachFee: '50',
      description: ''
    },

    // 选项数据
    coachList: [], // 简单教练列表
    courseTypes: [], // 课程类型
    statusOptions: ['已发布', '已暂停', '已终止'],
    statusValues: ['PUBLISHED', 'SUSPENDED', 'TERMINATED'],

    // 多选教练相关
    showCoachSelector: false,
    selectedCoaches: [],

    // 课表相关（保留原有功能）
    weekDays: [],
    timeSlots: [],
    weekRange: ''
  },

  async onLoad() {
    // 检查登录状态
    if (!auth.checkLoginAndRedirect()) {
      return;
    }

    // 获取当前校区
    this.initCurrentCampus();

    // 并行加载数据
    await Promise.all([
      this.loadCoachList(),
      this.loadCourseTypes(),
      this.loadCourseList()
    ]);

    // 初始化课表相关
    this.initTimeSlots();
    this.initWeekDays();
  },

  onShow() {
    // 更新TabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1 // 课程页是第二个标签，索引为1
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadCourseList(true);
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadCourseList();
    }
  },

  // 初始化当前校区
  initCurrentCampus() {
    const currentCampus = campusCache.getCurrentCampus();
    if (currentCampus) {
      this.setData({
        selectedCampusId: currentCampus.id
      });
    }
  },

  // 加载教练列表
  async loadCoachList() {
    if (!this.data.selectedCampusId) {
      return;
    }

    try {
      const response = await api.getSimpleCoachList(this.data.selectedCampusId);
      if (response.code === 200) {
        // 初始化每个教练的checked状态
        const coachList = (response.data || []).map(coach => ({
          ...coach,
          checked: false
        }));

        this.setData({
          coachList: coachList
        });
      } else {
        console.error('Load coach list error:', response.message);
      }
    } catch (error) {
      console.error('Load coach list error:', error);
    }
  },

  // 加载课程类型
  async loadCourseTypes() {
    try {
      const response = await api.getConstantsList('COURSE_TYPE');
      if (response.code === 200) {
        this.setData({
          courseTypes: response.data || []
        });
      } else {
        console.error('Load course types error:', response.message);
      }
    } catch (error) {
      console.error('Load course types error:', error);
    }
  },

  // 加载课程列表
  async loadCourseList(refresh = false) {
    if (!this.data.selectedCampusId) {
      return;
    }

    if (refresh) {
      this.setData({
        page: 1,
        courseList: [],
        hasMore: true
      });
    }

    this.setData({ loading: true });

    try {
      const response = await api.getCourseList(
        this.data.page,
        this.data.pageSize,
        this.data.selectedCampusId
      );

      if (response.code === 200) {
        const { data } = response;
        const newList = refresh ? data.list : [...this.data.courseList, ...data.list];

        this.setData({
          courseList: newList,
          total: data.total,
          page: this.data.page + 1,
          hasMore: data.list.length === this.data.pageSize && newList.length < data.total
        });
      } else {
        wx.showToast({
          title: response.message || '获取课程列表失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('Load course list error:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  // 初始化时间槽
  initTimeSlots() {
    const slots = []
    for (let hour = 8; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    this.setData({ timeSlots: slots })
  },

  // 初始化周数据
  initWeekDays() {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      weekDays.push({
        name: `${day.getMonth() + 1}月${day.getDate()}日`,
        date: day,
        courses: this.generateMockCourses(day)
      })
    }

    this.setData({
      weekDays,
      weekRange: `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`
    })
  },

  // 生成模拟课程数据
  generateMockCourses(date) {
    const courses = []
    const courseNames = ['少儿英语启蒙', '少儿英语进阶', '少儿英语提高']
    const teachers = ['张老师', '李老师', '王老师']
    const rooms = ['教室A', '教室B', '教室C']

    // 每天随机生成2-4节课
    const courseCount = Math.floor(Math.random() * 3) + 2
    for (let i = 0; i < courseCount; i++) {
      const startHour = Math.floor(Math.random() * 10) + 8 // 8:00-18:00
      courses.push({
        id: Math.random().toString(36).substr(2, 9),
        name: courseNames[Math.floor(Math.random() * courseNames.length)],
        teacherName: teachers[Math.floor(Math.random() * teachers.length)],
        roomName: rooms[Math.floor(Math.random() * rooms.length)],
        timeSlot: `${startHour.toString().padStart(2, '0')}:00`,
        duration: 45
      })
    }
    return courses
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  // 搜索课程
  onSearch(e) {
    const searchKey = e.detail.value
    this.setData({
      searchKey,
      page: 1,
      courseList: [],
      hasMore: true
    })
    this.loadCourseList(true)
  },

  // 显示添加课程弹窗
  showAddCourse() {
    // 重置所有教练的选中状态
    const coachList = this.data.coachList.map(coach => ({
      ...coach,
      checked: false
    }));

    // 获取默认课程类型（第一个）
    const defaultTypeId = this.data.courseTypes.length > 0 ? this.data.courseTypes[0].id : null;

    this.setData({
      showCourseModal: true,
      editingCourse: null,
      coachList: coachList,
      courseForm: {
        name: '',
        typeId: defaultTypeId,
        typeIndex: 0,
        status: 'PUBLISHED',
        statusIndex: 0,
        coachIds: [],
        coachIndexes: [],
        unitHours: '1.0',
        price: '100',
        coachFee: '50',
        description: ''
      },
      selectedCoaches: []
    })
  },

  // 显示编辑课程弹窗
  editCourse(e) {
    const courseId = e.currentTarget.dataset.id
    const course = this.data.courseList.find(c => c.id === courseId)
    if (course) {
      // 找到课程类型索引
      const typeIndex = this.data.courseTypes.findIndex(t => t.constantValue === course.type)

      // 找到状态索引
      const statusIndex = this.data.statusValues.indexOf(course.status)

      // 处理教练选择
      const selectedCoaches = course.coaches || []
      const coachIds = selectedCoaches.map(c => c.id)
      const coachIndexes = selectedCoaches.map(selectedCoach => {
        return this.data.coachList.findIndex(c => c.id === selectedCoach.id)
      }).filter(index => index !== -1)

      // 更新教练列表的checked状态
      const coachList = this.data.coachList.map(coach => ({
        ...coach,
        checked: coachIds.indexOf(coach.id) !== -1
      }));

      this.setData({
        showCourseModal: true,
        editingCourse: course,
        coachList: coachList,
        courseForm: {
          name: course.name,
          typeId: typeIndex !== -1 ? this.data.courseTypes[typeIndex].id : null,
          typeIndex: typeIndex !== -1 ? typeIndex : 0,
          status: course.status,
          statusIndex: statusIndex !== -1 ? statusIndex : 0,
          coachIds: coachIds,
          coachIndexes: coachIndexes,
          unitHours: course.unitHours ? course.unitHours.toString() : '1.0',
          price: course.price ? course.price.toString() : '100',
          coachFee: course.coachFee ? course.coachFee.toString() : '50',
          description: course.description || ''
        },
        selectedCoaches: selectedCoaches
      })
    }
  },

  // 显示课程详情
  showCourseDetail(e) {
    const courseId = e.currentTarget.dataset.id
    const course = this.data.courseList.find(c => c.id === courseId)
    if (course) {
      // 处理教练名称显示
      const coachNames = course.coaches ? course.coaches.map(coach => coach.name).join('、') : '无';

      const courseWithNames = {
        ...course,
        coachNames: coachNames
      };

      this.setData({
        showDetailModal: true,
        currentCourse: courseWithNames
      })
    }
  },

  // 显示课表课程详情
  showScheduleDetail(e) {
    const courseId = e.currentTarget.dataset.id
    // TODO: 从服务器获取课程详情
    const course = {
      id: courseId,
      name: '少儿英语启蒙',
      teacherName: '张老师',
      type: '常规课',
      level: '入门',
      duration: 45,
      studentCount: 8,
      maxStudents: 12,
      description: '适合3-6岁儿童的英语启蒙课程'
    }
    this.setData({
      showDetailModal: true,
      currentCourse: course
    })
  },

  // 删除课程
  deleteCourse(e) {
    const courseId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该课程吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...'
          })

          try {
            const response = await api.deleteCourse(courseId)
            wx.hideLoading()

            if (response.code === 200) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.loadCourseList(true)
            } else {
              wx.showToast({
                title: response.message || '删除失败',
                icon: 'none'
              })
            }
          } catch (error) {
            wx.hideLoading()
            console.error('Delete course error:', error)
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 隐藏课程弹窗
  hideCourseModal() {
    this.setData({
      showCourseModal: false,
      showCoachSelector: false
    })
  },

  // 隐藏详情弹窗
  hideDetailModal() {
    this.setData({ showDetailModal: false })
  },

  // 课程表单输入
  onCourseFormInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`courseForm.${field}`]: value
    })
  },

  // 选择课程类型
  onTypeChange(e) {
    const index = e.detail.value
    const courseType = this.data.courseTypes[index]
    this.setData({
      'courseForm.typeIndex': index,
      'courseForm.typeId': courseType.id
    })
  },

  // 选择课程状态
  onStatusChange(e) {
    const index = e.detail.value
    this.setData({
      'courseForm.statusIndex': index,
      'courseForm.status': this.data.statusValues[index]
    })
  },

  // 显示教练选择器
  showCoachSelector() {
    this.setData({
      showCoachSelector: true
    })
  },

  // 隐藏教练选择器
  hideCoachSelector() {
    this.setData({
      showCoachSelector: false
    })
  },

  // 教练选择变化 (按官方文档模式)
  onCoachChange(e) {
    const coachList = [...this.data.coachList] // Create a new array to avoid mutation
    const selectedValues = e.detail.value

    // 按照官方示例更新checked状态
    for (let i = 0, lenI = coachList.length; i < lenI; ++i) {
      coachList[i] = {...coachList[i]} // Create new object to ensure reactivity
      coachList[i].checked = false

      for (let j = 0, lenJ = selectedValues.length; j < lenJ; ++j) {
        // Convert both to string for comparison (checkbox values are always strings)
        if (coachList[i].id.toString() === selectedValues[j]) {
          coachList[i].checked = true
          break
        }
      }
    }

    // 获取选中的教练
    const selectedCoaches = coachList.filter(coach => coach.checked)
    const coachIds = selectedCoaches.map(coach => coach.id)
    const coachIndexes = selectedCoaches.map(coach => {
      return coachList.findIndex(c => c.id === coach.id)
    })

    // 更新表单数据
    const updatedForm = {
      ...this.data.courseForm,
      coachIds: coachIds,
      coachIndexes: coachIndexes
    }

    this.setData({
      coachList: coachList,
      courseForm: updatedForm,
      selectedCoaches: selectedCoaches
    })
  },

  // 保存课程
  async saveCourse() {
    const { courseForm, editingCourse } = this.data

    // 表单验证
    if (!courseForm.name.trim()) {
      wx.showToast({
        title: '请输入课程名称',
        icon: 'none'
      })
      return
    }

    if (!courseForm.typeId) {
      wx.showToast({
        title: '请选择课程类型',
        icon: 'none'
      })
      return
    }

    if (courseForm.coachIds.length === 0) {
      wx.showToast({
        title: '请选择上课教练',
        icon: 'none'
      })
      return
    }

    if (!courseForm.unitHours || isNaN(courseForm.unitHours) || parseFloat(courseForm.unitHours) <= 0) {
      wx.showToast({
        title: '请输入正确的每次消耗课时',
        icon: 'none'
      })
      return
    }

    if (!courseForm.price || isNaN(courseForm.price) || parseFloat(courseForm.price) <= 0) {
      wx.showToast({
        title: '请输入正确的课程单价',
        icon: 'none'
      })
      return
    }

    if (!courseForm.coachFee || isNaN(courseForm.coachFee) || parseFloat(courseForm.coachFee) <= 0) {
      wx.showToast({
        title: '请输入正确的教练课时费',
        icon: 'none'
      })
      return
    }

    // 构造课程数据
    const courseData = {
      name: courseForm.name.trim(),
      typeId: courseForm.typeId,
      status: courseForm.status === 'PUBLISHED' ? '1' : courseForm.status, // API bug workaround
      coachIds: courseForm.coachIds,
      unitHours: parseFloat(courseForm.unitHours),
      price: parseFloat(courseForm.price),
      coachFee: parseFloat(courseForm.coachFee),
      description: courseForm.description.trim(),
      campusId: this.data.selectedCampusId
    }

    // 编辑模式需要添加ID
    if (editingCourse) {
      courseData.id = editingCourse.id
    }

    wx.showLoading({
      title: editingCourse ? '更新中...' : '创建中...'
    })

    try {
      let response
      if (editingCourse) {
        response = await api.updateCourse(courseData)
      } else {
        response = await api.createCourse(courseData)
      }

      wx.hideLoading()

      if (response.code === 200) {
        this.hideCourseModal()
        wx.showToast({
          title: editingCourse ? '更新成功' : '创建成功',
          icon: 'success'
        })
        this.loadCourseList(true)
      } else {
        wx.showToast({
          title: response.message || '操作失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('Save course error:', error)
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    }
  },

  // 上一周
  prevWeek() {
    const weekStart = new Date(this.data.weekDays[0].date)
    weekStart.setDate(weekStart.getDate() - 7)
    this.updateWeekDays(weekStart)
  },

  // 下一周
  nextWeek() {
    const weekStart = new Date(this.data.weekDays[0].date)
    weekStart.setDate(weekStart.getDate() + 7)
    this.updateWeekDays(weekStart)
  },

  // 更新周数据
  updateWeekDays(weekStart) {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      weekDays.push({
        name: `${day.getMonth() + 1}月${day.getDate()}日`,
        date: day,
        courses: this.generateMockCourses(day)
      })
    }

    this.setData({
      weekDays,
      weekRange: `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`
    })
  }
}) 
