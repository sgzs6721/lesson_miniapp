const api = require('../../utils/api.js');
const auth = require('../../utils/auth.js');
const campusCache = require('../../utils/campus-cache.js');

Page({
  data: {
    searchKey: '', // 搜索关键词
    studentList: [], // 学员列表
    loading: false,
    
    // 分页相关
    pageNum: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,
    
    // 校区相关
    selectedCampusId: null,
    
    // 课程相关
    courseList: [], // 简单课程列表
    
    // 弹窗相关
    showStudentModal: false, // 是否显示学员表单弹窗
    editingStudent: null, // 当前正在编辑的学员
    studentForm: { // 学员表单数据
      name: '',
      gender: 'MALE',
      genderIndex: 0,
      age: '',
      phone: '',
      selectedCourses: [] // 选中的课程
    },
    
    // 选项数据
    genderOptions: ['男', '女'],
    genderValues: ['MALE', 'FEMALE'],
    weekdayOptions: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],

    // 课程选择相关
    showCourseSelector: false,
    showCourseDetailModal: false, // 统一的课程详情编辑弹窗
    currentCourseIndex: -1, // 当前编辑的课程索引
    editingCourseData: null, // 当前编辑的课程数据
    
    showDetailModal: false, // 是否显示学员详情弹窗
    currentStudent: {}, // 当前查看详情的学员

    // 课程详情弹窗
    showCourseInfoModal: false, // 是否显示课程详情弹窗
    currentCourseInfo: null, // 当前查看的课程详情
    showMoreActions: false, // 是否显示更多操作菜单

    // 缴费记录弹窗
    showPaymentModal: false, // 是否显示缴费记录弹窗
    paymentForm: {
      paymentType: 'NEW',
      paymentTypeIndex: 0,
      paymentMethod: 'ALIPAY',
      paymentMethodIndex: 0,
      amount: '',
      transactionDate: '',
      courseHours: '',
      giftHours: '',
      validUntil: '',
      giftItems: [],
      remark: ''
    },

    // 选项数据
    paymentTypeOptions: ['新缴费', '续费', '补缴'],
    paymentTypeValues: ['NEW', 'RENEWAL', 'SUPPLEMENT'],
    paymentMethodOptions: ['微信支付', '支付宝', '现金', '刷卡', '转账'],
    paymentMethodValues: ['WECHAT', 'ALIPAY', 'CASH', 'CARD', 'TRANSFER'],
    giftItemOptions: [], // 赠品选项，从API获取
    giftItemValues: [] // 赠品ID值
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
      this.loadCourseList(),
      this.loadStudentList()
    ]);
  },

  onShow() {
    // 更新TabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2 // 学员页是第三个标签，索引为2
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadStudentList(true);
  },

  // 上拉加载更多
  onReachBottom() {
    console.log('onReachBottom triggered, hasMore:', this.data.hasMore, 'loading:', this.data.loading);
    if (this.data.hasMore && !this.data.loading) {
      console.log('Loading more students...');
      this.loadStudentList();
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

  // 加载课程列表
  async loadCourseList() {
    if (!this.data.selectedCampusId) {
      return;
    }

    try {
      const response = await api.getSimpleCourseList(this.data.selectedCampusId);
      if (response.code === 200) {
        // 为每个课程添加checked属性和排课时间
        const courseList = (response.data || []).map(course => ({
          ...course,
          checked: false,
          enrollDate: new Date().toISOString().split('T')[0], // 默认今天
          fixedScheduleTimes: [] // 固定排课时间
        }));
        
        this.setData({
          courseList: courseList
        });
      } else {
        console.error('Load course list error:', response.message);
      }
    } catch (error) {
      console.error('Load course list error:', error);
    }
  },

  // 加载学员列表
  async loadStudentList(refresh = false) {
    if (!this.data.selectedCampusId) {
      return;
    }

    if (refresh) {
      this.setData({
        pageNum: 1,
        studentList: [],
        hasMore: true
      });
    }

    this.setData({ loading: true });

    try {
      const response = await api.getStudentList(
        this.data.pageNum,
        this.data.pageSize,
        this.data.selectedCampusId
      );

      if (response.code === 200) {
        const { data } = response;
        const newList = refresh ? data.list : [...this.data.studentList, ...data.list];

        this.setData({
          studentList: newList,
          total: data.total,
          pageNum: this.data.pageNum + 1,
          hasMore: data.list.length === this.data.pageSize && newList.length < data.total
        });
      } else {
        wx.showToast({
          title: response.message || '获取学员列表失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('Load student list error:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  // 搜索学员
  onSearch(e) {
    const searchKey = e.detail.value;
    this.setData({
      searchKey,
      pageNum: 1,
      studentList: [],
      hasMore: true
    });
    this.loadStudentList(true);
  },

  // 显示添加学员弹窗
  showAddStudent() {
    // 重置所有课程的选中状态
    const courseList = this.data.courseList.map(course => ({
      ...course,
      checked: false,
      fixedScheduleTimes: []
    }));

    this.setData({
      showStudentModal: true,
      editingStudent: null,
      courseList: courseList,
      studentForm: {
        name: '',
        gender: 'MALE',
        genderIndex: 0,
        age: '',
        phone: '',
        selectedCourses: []
      }
    });
  },

  // 显示编辑学员弹窗
  editStudent(e) {
    const studentId = e.currentTarget.dataset.id;
    const student = this.data.studentList.find(s => s.id === studentId);
    if (student) {
      // 找到性别索引
      const genderIndex = this.data.genderValues.indexOf(student.studentGender);

      // 处理课程选择
      const selectedCourses = student.courses || [];
      const courseIds = selectedCourses.map(c => c.courseId);

      // 更新课程列表的checked状态和排课时间
      const courseList = this.data.courseList.map(course => {
        const selectedCourse = selectedCourses.find(sc => sc.courseId === course.id);
        let scheduleArray = [];

        if (selectedCourse && selectedCourse.fixedSchedule) {
          try {
            if (typeof selectedCourse.fixedSchedule === 'string') {
              // API returns JSON string, need to parse it
              scheduleArray = JSON.parse(selectedCourse.fixedSchedule);
            } else if (Array.isArray(selectedCourse.fixedSchedule)) {
              scheduleArray = selectedCourse.fixedSchedule;
            }

            // Ensure proper data types
            scheduleArray = scheduleArray.map(item => ({
              weekday: parseInt(item.weekday),
              from: item.from,
              to: item.to
            }));
          } catch (error) {
            console.error('Error parsing course schedule:', error);
            scheduleArray = [];
          }
        }

        return {
          ...course,
          checked: courseIds.indexOf(course.id) !== -1,
          enrollDate: selectedCourse ? selectedCourse.enrollmentDate : new Date().toISOString().split('T')[0],
          fixedScheduleTimes: scheduleArray
        };
      });

      // 构建选中的课程数据，包含完整信息
      const selectedCoursesWithDetails = selectedCourses.map(sc => {
        const courseInfo = this.data.courseList.find(c => c.id === sc.courseId);
        console.log('Building course details for:', sc.courseName);
        console.log('API fixedSchedule:', sc.fixedSchedule);
        console.log('Type of fixedSchedule:', typeof sc.fixedSchedule);
        console.log('Is fixedSchedule array?', Array.isArray(sc.fixedSchedule));

        // Parse JSON string to array if needed
        let scheduleArray = [];
        if (sc.fixedSchedule) {
          try {
            if (typeof sc.fixedSchedule === 'string') {
              // API returns JSON string, need to parse it
              scheduleArray = JSON.parse(sc.fixedSchedule);
              console.log('Parsed schedule array:', scheduleArray);
            } else if (Array.isArray(sc.fixedSchedule)) {
              scheduleArray = sc.fixedSchedule;
            }
          } catch (error) {
            console.error('Error parsing fixedSchedule:', error);
            scheduleArray = [];
          }
        }

        // Ensure all schedule items have proper data types
        scheduleArray = scheduleArray.map(item => ({
          weekday: parseInt(item.weekday),
          from: item.from,
          to: item.to
        }));

        return {
          id: courseInfo.id,
          name: courseInfo.name,
          typeName: courseInfo.typeName,
          coaches: courseInfo.coaches,
          enrollDate: sc.enrollmentDate,
          fixedScheduleTimes: scheduleArray,
          checked: true
        };
      });

      this.setData({
        showStudentModal: true,
        editingStudent: student,
        courseList: courseList,
        studentForm: {
          name: student.studentName,
          gender: student.studentGender,
          genderIndex: genderIndex !== -1 ? genderIndex : 0,
          age: student.studentAge ? student.studentAge.toString() : '',
          phone: student.studentPhone,
          selectedCourses: selectedCoursesWithDetails
        }
      });
    }
  },

  // 显示学员详情
  showStudentDetail(e) {
    const studentId = e.currentTarget.dataset.id;
    const student = this.data.studentList.find(s => s.id === studentId);
    if (student) {
      console.log('=== showStudentDetail ===');
      console.log('Original student data:', student);

      // Process courses to parse fixedSchedule JSON strings
      const processedStudent = {
        ...student,
        courses: student.courses.map(course => {
          console.log('Processing course:', course.courseName);
          console.log('Original fixedSchedule:', course.fixedSchedule);
          console.log('Type:', typeof course.fixedSchedule);

          let parsedSchedule = [];
          if (course.fixedSchedule) {
            try {
              if (typeof course.fixedSchedule === 'string') {
                // Parse JSON string to array
                parsedSchedule = JSON.parse(course.fixedSchedule);
                console.log('Parsed schedule:', parsedSchedule);
              } else if (Array.isArray(course.fixedSchedule)) {
                parsedSchedule = course.fixedSchedule;
              }

              // Ensure proper data types
              parsedSchedule = parsedSchedule.map(item => ({
                weekday: parseInt(item.weekday),
                from: item.from,
                to: item.to
              }));
            } catch (error) {
              console.error('Error parsing course schedule in detail:', error);
              parsedSchedule = [];
            }
          }

          return {
            ...course,
            fixedSchedule: parsedSchedule
          };
        })
      };

      console.log('Processed student data:', processedStudent);

      this.setData({
        showDetailModal: true,
        currentStudent: processedStudent
      });
    }
  },

  // 隐藏学员弹窗
  hideStudentModal() {
    this.setData({ 
      showStudentModal: false,
      showCourseSelector: false
    });
  },

  // 隐藏详情弹窗
  hideDetailModal() {
    this.setData({ showDetailModal: false });
  },

  // 显示课程详情弹窗
  showCourseInfoModal(e) {
    const courseIndex = e.currentTarget.dataset.courseIndex;
    const course = this.data.currentStudent.courses[courseIndex];

    console.log('=== showCourseInfoModal ===');
    console.log('Course info:', course);

    this.setData({
      showCourseInfoModal: true,
      currentCourseInfo: course,
      showMoreActions: false
    });
  },

  // 隐藏课程详情弹窗
  hideCourseInfoModal() {
    this.setData({
      showCourseInfoModal: false,
      currentCourseInfo: null,
      showMoreActions: false
    });
  },

  // 切换更多操作菜单
  toggleMoreActions() {
    this.setData({
      showMoreActions: !this.data.showMoreActions
    });
  },

  // 课程记录（待实现）
  showCourseRecords() {
    wx.showToast({
      title: '课程记录功能待实现',
      icon: 'none'
    });
  },

  // 缴费登记
  async showPaymentRecord() {
    // 重置表单数据
    this.setData({
      showPaymentModal: true,
      paymentForm: {
        paymentType: 'NEW',
        paymentTypeIndex: 0,
        paymentMethod: 'WECHAT',
        paymentMethodIndex: 0,
        amount: '',
        transactionDate: new Date().toISOString().split('T')[0], // 默认今天
        courseHours: '',
        giftHours: '0',
        validUntil: '',
        giftItems: [],
        notes: ''
      }
    });

    // 加载赠品选项
    await this.loadGiftItems();
  },

  // 加载赠品选项
  async loadGiftItems() {
    try {
      const response = await api.getGiftItems();
      if (response.code === 200) {
        const giftItems = response.data || [];
        const giftItemOptions = giftItems.map(item => item.constantValue);
        const giftItemValues = giftItems.map(item => item.id);

        this.setData({
          giftItemOptions: giftItemOptions,
          giftItemValues: giftItemValues
        });

        console.log('Gift items loaded:', giftItems);
      } else {
        console.error('Load gift items error:', response.message);
      }
    } catch (error) {
      console.error('Load gift items error:', error);
    }
  },

  // 隐藏缴费记录弹窗
  hidePaymentModal() {
    this.setData({
      showPaymentModal: false
    });
  },

  // 缴费表单输入
  onPaymentFormInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`paymentForm.${field}`]: value
    });
  },

  // 缴费类型选择
  onPaymentTypeChange(e) {
    const index = e.detail.value;
    this.setData({
      'paymentForm.paymentTypeIndex': index,
      'paymentForm.paymentType': this.data.paymentTypeValues[index]
    });
  },

  // 支付方式选择
  onPaymentMethodChange(e) {
    const index = e.detail.value;
    this.setData({
      'paymentForm.paymentMethodIndex': index,
      'paymentForm.paymentMethod': this.data.paymentMethodValues[index]
    });
  },

  // 赠品选择
  onGiftItemsChange(e) {
    const selectedValues = e.detail.value;
    this.setData({
      'paymentForm.giftItems': selectedValues.map(v => parseInt(v))
    });
  },

  // 提交缴费记录
  async submitPayment() {
    const { paymentForm, currentCourseInfo, currentStudent } = this.data;

    // 表单验证
    if (!paymentForm.amount || isNaN(paymentForm.amount) || parseFloat(paymentForm.amount) <= 0) {
      wx.showToast({
        title: '请输入正确的缴费金额',
        icon: 'none'
      });
      return;
    }

    if (!paymentForm.transactionDate) {
      wx.showToast({
        title: '请选择交易日期',
        icon: 'none'
      });
      return;
    }

    if (!paymentForm.courseHours || isNaN(paymentForm.courseHours) || parseInt(paymentForm.courseHours) <= 0) {
      wx.showToast({
        title: '请输入正确的正课课时',
        icon: 'none'
      });
      return;
    }

    if (!paymentForm.validUntil) {
      wx.showToast({
        title: '请选择有效期',
        icon: 'none'
      });
      return;
    }

    // 构造缴费数据
    const paymentData = {
      studentId: currentStudent.id,
      courseId: currentCourseInfo.courseId,
      paymentType: paymentForm.paymentType,
      amount: parseFloat(paymentForm.amount),
      paymentMethod: paymentForm.paymentMethod,
      transactionDate: paymentForm.transactionDate,
      courseHours: parseInt(paymentForm.courseHours),
      giftHours: parseInt(paymentForm.giftHours) || 0,
      validUntil: paymentForm.validUntil,
      giftItems: paymentForm.giftItems,
      notes: paymentForm.notes
    };

    console.log('Payment data:', paymentData);

    wx.showLoading({
      title: '提交中...'
    });

    try {
      const response = await api.createStudentPayment(paymentData);
      wx.hideLoading();

      if (response.code === 200) {
        wx.showToast({
          title: '缴费记录提交成功',
          icon: 'success'
        });
        this.hidePaymentModal();
        // 可以在这里刷新学员数据
      } else {
        wx.showToast({
          title: response.message || '提交失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('Submit payment error:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    }
  },

  // 退课（待实现）
  withdrawCourse() {
    wx.showModal({
      title: '确认退课',
      content: '确定要退出该课程吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '退课功能待实现',
            icon: 'none'
          });
        }
      }
    });
  },

  // 转课（待实现）
  transferCourse() {
    wx.showToast({
      title: '转课功能待实现',
      icon: 'none'
    });
  },

  // 转班（待实现）
  changeClass() {
    wx.showToast({
      title: '转班功能待实现',
      icon: 'none'
    });
  },

  // 学员表单输入
  onStudentFormInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`studentForm.${field}`]: value
    });
  },

  // 选择性别
  onGenderChange(e) {
    const index = e.detail.value;
    this.setData({
      'studentForm.genderIndex': index,
      'studentForm.gender': this.data.genderValues[index]
    });
  },

  // 显示课程选择器
  showCourseSelector() {
    this.setData({
      showCourseSelector: true
    });
  },

  // 隐藏课程选择器
  hideCourseSelector() {
    this.setData({
      showCourseSelector: false
    });
  },

  // 显示课程详情编辑弹窗
  showCourseDetailModal(e) {
    const courseIndex = e.currentTarget.dataset.index;
    const course = this.data.studentForm.selectedCourses[courseIndex];

    console.log('=== showCourseDetailModal ===');
    console.log('Course index:', courseIndex);
    console.log('Course data:', course);
    console.log('Fixed schedule times:', course.fixedScheduleTimes);
    console.log('Is array?', Array.isArray(course.fixedScheduleTimes));
    console.log('Length:', course.fixedScheduleTimes ? course.fixedScheduleTimes.length : 'undefined');

    // Ensure we have a clean array
    const cleanScheduleTimes = [];
    if (Array.isArray(course.fixedScheduleTimes)) {
      course.fixedScheduleTimes.forEach(item => {
        if (item && typeof item === 'object' && item.weekday && item.from && item.to) {
          cleanScheduleTimes.push({
            weekday: item.weekday,
            from: item.from,
            to: item.to
          });
        }
      });
    }

    console.log('Clean schedule times:', cleanScheduleTimes);

    this.setData({
      showCourseDetailModal: true,
      currentCourseIndex: courseIndex,
      editingCourseData: {
        ...course,
        enrollDate: course.enrollDate || new Date().toISOString().split('T')[0],
        fixedScheduleTimes: cleanScheduleTimes
      }
    });
  },

  // 隐藏课程详情编辑弹窗
  hideCourseDetailModal() {
    this.setData({
      showCourseDetailModal: false,
      currentCourseIndex: -1,
      editingCourseData: null
    });
  },

  // 保存课程详情
  saveCourseDetail() {
    const { currentCourseIndex, editingCourseData, studentForm } = this.data;
    if (currentCourseIndex === -1 || !editingCourseData) return;

    const selectedCourses = [...studentForm.selectedCourses];
    selectedCourses[currentCourseIndex] = {
      ...selectedCourses[currentCourseIndex],
      enrollDate: editingCourseData.enrollDate,
      fixedScheduleTimes: editingCourseData.fixedScheduleTimes
    };

    this.setData({
      'studentForm.selectedCourses': selectedCourses
    });

    this.hideCourseDetailModal();
  },

  // 更新课程报名日期
  onEnrollDateChange(e) {
    this.setData({
      'editingCourseData.enrollDate': e.detail.value
    });
  },

  // 添加排课时间
  addScheduleTime() {
    console.log('=== addScheduleTime ===');
    console.log('Current editingCourseData:', this.data.editingCourseData);
    console.log('Current fixedScheduleTimes:', this.data.editingCourseData.fixedScheduleTimes);

    const currentTimes = this.data.editingCourseData.fixedScheduleTimes || [];
    console.log('Current times array:', currentTimes);
    console.log('Is array?', Array.isArray(currentTimes));
    console.log('Length:', currentTimes.length);

    const newTimes = [...currentTimes, {
      weekday: 1, // 默认周一
      from: '09:00',
      to: '10:00'
    }];

    console.log('New times array:', newTimes);
    console.log('New length:', newTimes.length);

    this.setData({
      'editingCourseData.fixedScheduleTimes': newTimes
    });
  },

  // 删除排课时间
  removeScheduleTime(e) {
    const timeIndex = e.currentTarget.dataset.index;
    const editingCourseData = { ...this.data.editingCourseData };
    const fixedScheduleTimes = [...(editingCourseData.fixedScheduleTimes || [])];
    fixedScheduleTimes.splice(timeIndex, 1);

    this.setData({
      'editingCourseData.fixedScheduleTimes': fixedScheduleTimes
    });
  },

  // 更新排课时间
  onScheduleTimeChange(e) {
    const { field } = e.currentTarget.dataset;
    const timeIndex = parseInt(e.currentTarget.dataset.timeIndex); // data-time-index becomes timeIndex
    const { value } = e.detail;
    const editingCourseData = { ...this.data.editingCourseData };
    const fixedScheduleTimes = [...(editingCourseData.fixedScheduleTimes || [])];

    console.log('Schedule change:', { field, timeIndex, value, fixedScheduleTimes });

    if (fixedScheduleTimes[timeIndex] !== undefined) {
      fixedScheduleTimes[timeIndex] = {
        ...fixedScheduleTimes[timeIndex],
        [field]: field === 'weekday' ? parseInt(value) + 1 : value
      };

      this.setData({
        'editingCourseData.fixedScheduleTimes': fixedScheduleTimes
      });
    }
  },

  // 课程选择变化
  onCourseChange(e) {
    const courseList = [...this.data.courseList];
    const selectedValues = e.detail.value;

    // 按照官方示例更新checked状态
    for (let i = 0, lenI = courseList.length; i < lenI; ++i) {
      courseList[i] = {...courseList[i]};
      courseList[i].checked = false;

      for (let j = 0, lenJ = selectedValues.length; j < lenJ; ++j) {
        if (courseList[i].id.toString() === selectedValues[j]) {
          courseList[i].checked = true;
          break;
        }
      }
    }

    // 获取选中的课程，确保每个课程都有正确的数据结构
    const selectedCourses = courseList.filter(course => course.checked).map(course => {
      console.log('Processing selected course:', course.name, course.fixedScheduleTimes);
      return {
        id: course.id,
        name: course.name,
        typeName: course.typeName,
        coaches: course.coaches,
        enrollDate: course.enrollDate || new Date().toISOString().split('T')[0],
        fixedScheduleTimes: [] // Always start with empty array for new selections
      };
    });

    console.log('Final selected courses:', selectedCourses);

    // 更新表单数据
    const updatedForm = {
      ...this.data.studentForm,
      selectedCourses: selectedCourses
    };

    this.setData({
      courseList: courseList,
      studentForm: updatedForm
    });
  },

  // 保存学员
  async saveStudent() {
    const { studentForm, editingStudent } = this.data;

    // 表单验证
    if (!studentForm.name.trim()) {
      wx.showToast({
        title: '请输入学员姓名',
        icon: 'none'
      });
      return;
    }

    if (!studentForm.phone.trim()) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      });
      return;
    }

    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(studentForm.phone.trim())) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    if (!studentForm.age || isNaN(studentForm.age) || parseInt(studentForm.age) <= 0) {
      wx.showToast({
        title: '请输入正确的年龄',
        icon: 'none'
      });
      return;
    }

    if (studentForm.selectedCourses.length === 0) {
      wx.showToast({
        title: '请至少选择一门课程',
        icon: 'none'
      });
      return;
    }

    // 构造学员数据
    const studentData = {
      studentInfo: {
        name: studentForm.name.trim(),
        gender: studentForm.gender,
        age: parseInt(studentForm.age),
        phone: studentForm.phone.trim(),
        campusId: this.data.selectedCampusId
      },
      courseInfoList: studentForm.selectedCourses.map(course => ({
        courseId: course.id,
        courseName: course.name,
        courseTypeName: course.typeName,
        enrollDate: course.enrollDate || new Date().toISOString().split('T')[0],
        fixedScheduleTimes: course.fixedScheduleTimes || [],
        coachName: course.coaches && course.coaches.length > 0 ? course.coaches[0].name : '',
        status: 'STUDYING'
      }))
    };

    // 编辑模式需要添加学员ID
    if (editingStudent) {
      studentData.studentId = editingStudent.id;
    }

    wx.showLoading({
      title: editingStudent ? '更新中...' : '创建中...'
    });

    try {
      let response;
      if (editingStudent) {
        response = await api.updateStudent(studentData);
      } else {
        response = await api.createStudent(studentData);
      }

      wx.hideLoading();

      if (response.code === 200) {
        this.hideStudentModal();
        wx.showToast({
          title: editingStudent ? '更新成功' : '创建成功',
          icon: 'success'
        });
        this.loadStudentList(true);
      } else {
        wx.showToast({
          title: response.message || '操作失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('Save student error:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    }
  },

  // 删除学员
  deleteStudent(e) {
    const studentId = e.currentTarget.dataset.id;
    const student = this.data.studentList.find(s => s.id === studentId);

    wx.showModal({
      title: '确认删除',
      content: `确定要删除学员"${student.studentName}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...'
          });

          try {
            const response = await api.deleteStudent(studentId);
            wx.hideLoading();

            if (response.code === 200) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.loadStudentList(true);
            } else {
              wx.showToast({
                title: response.message || '删除失败',
                icon: 'none'
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('Delete student error:', error);
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  }
});
