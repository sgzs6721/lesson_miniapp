Page({
  data: {
    activeTab: 'info', // 当前激活的标签页：info 或 attendance
    searchKey: '', // 搜索关键词
    
    // 学员列表相关
    studentList: [], // 学员列表
    studentTotal: 0, // 学员总数
    
    // 出勤记录相关
    currentMonth: '', // 当前选择的月份
    courseList: [], // 课程列表
    courseIndex: 0, // 当前选择的课程索引
    selectedCourse: null, // 当前选择的课程
    statusOptions: ['全部', '已到', '未到', '请假'],
    statusIndex: 0, // 当前选择的状态索引
    attendanceList: [], // 出勤记录列表
    
    // 弹窗相关
    showStudentModal: false, // 是否显示学员表单弹窗
    editingStudent: null, // 当前正在编辑的学员
    studentForm: { // 学员表单数据
      name: '',
      gender: '',
      genderIndex: -1,
      age: '',
      phone: '',
      parentName: '',
      remark: ''
    },
    showDetailModal: false, // 是否显示学员详情弹窗
    currentStudent: {} // 当前查看详情的学员
  },
  
  onLoad() {
    this.initData();
  },
  
  onShow() {
    // 设置底部导航选中项
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
    
    // 刷新数据
    this.loadStudentList();
    if (this.data.activeTab === 'attendance') {
      this.loadAttendanceList();
    }
  },
  
  // 初始化数据
  initData() {
    // 设置当前月份
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    this.setData({
      currentMonth: `${year}-${month < 10 ? '0' + month : month}`
    });
    
    // 加载课程列表
    this.loadCourseList();
    
    // 加载学员列表
    this.loadStudentList();
  },
  
  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    
    // 切换到出勤记录标签页时，加载出勤记录
    if (tab === 'attendance' && this.data.attendanceList.length === 0) {
      this.loadAttendanceList();
    }
  },
  
  // 搜索学员
  onSearch(e) {
    const searchKey = e.detail.value;
    this.setData({ searchKey });
    this.loadStudentList();
  },
  
  // 加载学员列表
  loadStudentList() {
    // 模拟从服务器获取数据
    // 实际项目中应该调用API获取数据
    const mockStudents = [
      {
        id: 1,
        name: '张小明',
        gender: 'male',
        age: 10,
        phone: '13800138001',
        parentName: '张先生',
        courseCount: 2,
        attendanceRate: '95%',
        remark: '性格活泼，学习积极'
      },
      {
        id: 2,
        name: '李小红',
        gender: 'female',
        age: 9,
        phone: '13800138002',
        parentName: '李女士',
        courseCount: 3,
        attendanceRate: '100%',
        remark: '认真听讲，完成作业及时'
      },
      {
        id: 3,
        name: '王小刚',
        gender: 'male',
        age: 11,
        phone: '13800138003',
        parentName: '王先生',
        courseCount: 1,
        attendanceRate: '85%',
        remark: '需要加强练习'
      }
    ];
    
    // 根据搜索关键词过滤
    let filteredStudents = mockStudents;
    if (this.data.searchKey) {
      const key = this.data.searchKey.toLowerCase();
      filteredStudents = mockStudents.filter(student => 
        student.name.toLowerCase().includes(key) || 
        student.phone.includes(key) ||
        student.parentName.toLowerCase().includes(key)
      );
    }
    
    this.setData({
      studentList: filteredStudents,
      studentTotal: filteredStudents.length
    });
  },
  
  // 加载课程列表
  loadCourseList() {
    // 模拟从服务器获取数据
    const mockCourses = [
      { id: 1, name: '数学基础班' },
      { id: 2, name: '英语口语班' },
      { id: 3, name: '编程启蒙班' }
    ];
    
    this.setData({
      courseList: mockCourses,
      selectedCourse: mockCourses[0]
    });
  },
  
  // 加载出勤记录列表
  loadAttendanceList() {
    // 模拟从服务器获取数据
    const mockAttendance = [
      {
        id: 1,
        date: '2023-11-01',
        courseName: '数学基础班',
        studentName: '张小明',
        time: '14:00-15:30',
        status: 'checked'
      },
      {
        id: 2,
        date: '2023-11-02',
        courseName: '英语口语班',
        studentName: '李小红',
        time: '16:00-17:30',
        status: 'checked'
      },
      {
        id: 3,
        date: '2023-11-03',
        courseName: '编程启蒙班',
        studentName: '王小刚',
        time: '10:00-11:30',
        status: 'absent'
      },
      {
        id: 4,
        date: '2023-11-04',
        courseName: '数学基础班',
        studentName: '张小明',
        time: '14:00-15:30',
        status: 'leave'
      }
    ];
    
    // 根据筛选条件过滤
    let filteredAttendance = mockAttendance;
    
    // 按月份筛选
    if (this.data.currentMonth) {
      const monthPrefix = this.data.currentMonth;
      filteredAttendance = filteredAttendance.filter(item => 
        item.date.startsWith(monthPrefix)
      );
    }
    
    // 按课程筛选
    if (this.data.selectedCourse) {
      filteredAttendance = filteredAttendance.filter(item => 
        item.courseName === this.data.selectedCourse.name
      );
    }
    
    // 按状态筛选
    if (this.data.statusIndex > 0) {
      const statusMap = {
        1: 'checked',
        2: 'absent',
        3: 'leave'
      };
      const status = statusMap[this.data.statusIndex];
      filteredAttendance = filteredAttendance.filter(item => 
        item.status === status
      );
    }
    
    this.setData({
      attendanceList: filteredAttendance
    });
  },
  
  // 月份选择变化
  onMonthChange(e) {
    this.setData({
      currentMonth: e.detail.value
    });
    this.loadAttendanceList();
  },
  
  // 课程选择变化
  onCourseChange(e) {
    const index = e.detail.value;
    this.setData({
      courseIndex: index,
      selectedCourse: this.data.courseList[index]
    });
    this.loadAttendanceList();
  },
  
  // 状态选择变化
  onStatusChange(e) {
    this.setData({
      statusIndex: e.detail.value
    });
    this.loadAttendanceList();
  },
  
  // 显示添加学员弹窗
  showAddStudent() {
    this.setData({
      showStudentModal: true,
      editingStudent: null,
      studentForm: {
        name: '',
        gender: '',
        genderIndex: -1,
        age: '',
        phone: '',
        parentName: '',
        remark: ''
      }
    });
  },
  
  // 显示编辑学员弹窗
  editStudent(e) {
    const id = e.currentTarget.dataset.id;
    const student = this.data.studentList.find(s => s.id === id);
    if (student) {
      this.setData({
        showStudentModal: true,
        editingStudent: student,
        studentForm: {
          name: student.name,
          gender: student.gender,
          genderIndex: student.gender === 'male' ? 0 : 1,
          age: student.age,
          phone: student.phone,
          parentName: student.parentName,
          remark: student.remark || ''
        }
      });
    }
  },
  
  // 隐藏学员表单弹窗
  hideStudentModal() {
    this.setData({
      showStudentModal: false
    });
  },
  
  // 学员表单输入变化
  onStudentFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`studentForm.${field}`]: value
    });
  },
  
  // 性别选择变化
  onGenderChange(e) {
    const index = e.detail.value;
    const gender = index == 0 ? 'male' : 'female';
    this.setData({
      'studentForm.gender': gender,
      'studentForm.genderIndex': index
    });
  },
  
  // 保存学员
  saveStudent() {
    const form = this.data.studentForm;
    
    // 表单验证
    if (!form.name) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }
    
    if (!form.gender) {
      wx.showToast({
        title: '请选择性别',
        icon: 'none'
      });
      return;
    }
    
    if (!form.age) {
      wx.showToast({
        title: '请输入年龄',
        icon: 'none'
      });
      return;
    }
    
    if (!form.phone) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      });
      return;
    }
    
    // 构造学员数据
    const studentData = {
      name: form.name,
      gender: form.gender,
      age: parseInt(form.age),
      phone: form.phone,
      parentName: form.parentName,
      remark: form.remark,
      courseCount: 0,
      attendanceRate: '0%'
    };
    
    // 编辑模式
    if (this.data.editingStudent) {
      studentData.id = this.data.editingStudent.id;
      studentData.courseCount = this.data.editingStudent.courseCount;
      studentData.attendanceRate = this.data.editingStudent.attendanceRate;
      
      // 更新学员列表
      const index = this.data.studentList.findIndex(s => s.id === studentData.id);
      if (index !== -1) {
        const newList = [...this.data.studentList];
        newList[index] = studentData;
        this.setData({
          studentList: newList
        });
      }
    } 
    // 添加模式
    else {
      studentData.id = Date.now(); // 生成临时ID
      
      // 添加到学员列表
      this.setData({
        studentList: [studentData, ...this.data.studentList],
        studentTotal: this.data.studentTotal + 1
      });
    }
    
    // 关闭弹窗并提示
    this.hideStudentModal();
    wx.showToast({
      title: this.data.editingStudent ? '编辑成功' : '添加成功',
      icon: 'success'
    });
  },
  
  // 删除学员
  deleteStudent(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该学员吗？',
      success: res => {
        if (res.confirm) {
          // 从列表中删除
          const newList = this.data.studentList.filter(s => s.id !== id);
          this.setData({
            studentList: newList,
            studentTotal: newList.length
          });
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },
  
  // 显示学员详情
  showStudentDetail(e) {
    const id = e.currentTarget.dataset.id;
    const student = this.data.studentList.find(s => s.id === id);
    if (student) {
      this.setData({
        showDetailModal: true,
        currentStudent: {
          ...student,
          courses: '数学基础班、英语口语班' // 模拟数据
        }
      });
    }
  },
  
  // 隐藏学员详情弹窗
  hideDetailModal() {
    this.setData({
      showDetailModal: false
    });
  }
}) 