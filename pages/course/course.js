const app = getApp()

Page({
  data: {
    activeTab: 'course',
    searchKey: '',
    courseList: [],
    weekDays: [],
    timeSlots: [],
    weekRange: '',
    showCourseModal: false,
    showDetailModal: false,
    editingCourse: null,
    currentCourse: null,
    courseForm: {
      name: '',
      teacherIndex: 0,
      teacherName: '',
      typeIndex: 0,
      type: '',
      levelIndex: 0,
      level: '',
      duration: '',
      maxStudents: '',
      description: ''
    },
    teacherList: [],
    courseTypes: ['常规课', '体验课', '补课', '试听课'],
    courseLevels: ['入门', '初级', '中级', '高级']
  },

  onLoad() {
    this.initTimeSlots()
    this.loadTeacherList()
    this.loadCourseList()
    this.initWeekDays()
  },

  onShow() {
    // 更新TabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1 // 课程页是第二个标签，索引为1
      });
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

  // 加载教师列表
  loadTeacherList() {
    // TODO: 从服务器获取教师列表
    const teacherList = [
      { id: 1, name: '张老师' },
      { id: 2, name: '李老师' },
      { id: 3, name: '王老师' }
    ]
    this.setData({ teacherList })
  },

  // 加载课程列表
  loadCourseList() {
    // TODO: 从服务器获取课程列表
    const courseList = [
      {
        id: 1,
        name: '少儿英语启蒙',
        teacherName: '张老师',
        type: '常规课',
        level: '入门',
        duration: 45,
        studentCount: 8,
        maxStudents: 12,
        description: '适合3-6岁儿童的英语启蒙课程'
      },
      {
        id: 2,
        name: '少儿英语进阶',
        teacherName: '李老师',
        type: '常规课',
        level: '初级',
        duration: 60,
        studentCount: 10,
        maxStudents: 15,
        description: '适合6-9岁儿童的英语进阶课程'
      }
    ]
    this.setData({ courseList })
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
    this.setData({ searchKey })
    // TODO: 实现搜索逻辑
  },

  // 显示添加课程弹窗
  showAddCourse() {
    this.setData({
      showCourseModal: true,
      editingCourse: null,
      courseForm: {
        name: '',
        teacherIndex: 0,
        teacherName: '',
        typeIndex: 0,
        type: '',
        levelIndex: 0,
        level: '',
        duration: '',
        maxStudents: '',
        description: ''
      }
    })
  },

  // 显示编辑课程弹窗
  editCourse(e) {
    const courseId = e.currentTarget.dataset.id
    const course = this.data.courseList.find(c => c.id === courseId)
    if (course) {
      const teacherIndex = this.data.teacherList.findIndex(t => t.name === course.teacherName)
      const typeIndex = this.data.courseTypes.indexOf(course.type)
      const levelIndex = this.data.courseLevels.indexOf(course.level)
      this.setData({
        showCourseModal: true,
        editingCourse: course,
        courseForm: {
          name: course.name,
          teacherIndex: teacherIndex >= 0 ? teacherIndex : 0,
          teacherName: course.teacherName,
          typeIndex: typeIndex >= 0 ? typeIndex : 0,
          type: course.type,
          levelIndex: levelIndex >= 0 ? levelIndex : 0,
          level: course.level,
          duration: course.duration.toString(),
          maxStudents: course.maxStudents.toString(),
          description: course.description
        }
      })
    }
  },

  // 显示课程详情
  showCourseDetail(e) {
    const courseId = e.currentTarget.dataset.id
    const course = this.data.courseList.find(c => c.id === courseId)
    if (course) {
      this.setData({
        showDetailModal: true,
        currentCourse: course
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
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用删除课程接口
          const courseList = this.data.courseList.filter(c => c.id !== courseId)
          this.setData({ courseList })
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 隐藏课程弹窗
  hideCourseModal() {
    this.setData({ showCourseModal: false })
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

  // 选择教师
  onTeacherChange(e) {
    const index = e.detail.value
    const teacher = this.data.teacherList[index]
    this.setData({
      'courseForm.teacherIndex': index,
      'courseForm.teacherName': teacher.name
    })
  },

  // 选择课程类型
  onTypeChange(e) {
    const index = e.detail.value
    this.setData({
      'courseForm.typeIndex': index,
      'courseForm.type': this.data.courseTypes[index]
    })
  },

  // 选择课程级别
  onLevelChange(e) {
    const index = e.detail.value
    this.setData({
      'courseForm.levelIndex': index,
      'courseForm.level': this.data.courseLevels[index]
    })
  },

  // 保存课程
  saveCourse() {
    const { courseForm, editingCourse } = this.data
    if (!courseForm.name) {
      wx.showToast({
        title: '请输入课程名称',
        icon: 'none'
      })
      return
    }
    if (!courseForm.teacherName) {
      wx.showToast({
        title: '请选择授课老师',
        icon: 'none'
      })
      return
    }
    if (!courseForm.type) {
      wx.showToast({
        title: '请选择课程类型',
        icon: 'none'
      })
      return
    }
    if (!courseForm.level) {
      wx.showToast({
        title: '请选择课程级别',
        icon: 'none'
      })
      return
    }
    if (!courseForm.duration) {
      wx.showToast({
        title: '请输入课程时长',
        icon: 'none'
      })
      return
    }
    if (!courseForm.maxStudents) {
      wx.showToast({
        title: '请输入最大人数',
        icon: 'none'
      })
      return
    }

    // TODO: 调用保存课程接口
    const course = {
      id: editingCourse ? editingCourse.id : Math.random().toString(36).substr(2, 9),
      name: courseForm.name,
      teacherName: courseForm.teacherName,
      type: courseForm.type,
      level: courseForm.level,
      duration: parseInt(courseForm.duration),
      maxStudents: parseInt(courseForm.maxStudents),
      studentCount: editingCourse ? editingCourse.studentCount : 0,
      description: courseForm.description
    }

    let courseList = [...this.data.courseList]
    if (editingCourse) {
      const index = courseList.findIndex(c => c.id === course.id)
      courseList[index] = course
    } else {
      courseList.unshift(course)
    }

    this.setData({
      courseList,
      showCourseModal: false
    })

    wx.showToast({
      title: editingCourse ? '编辑成功' : '添加成功',
      icon: 'success'
    })
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