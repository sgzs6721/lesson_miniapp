Page({
  data: {
    searchKey: '', // 搜索关键词
    coachList: [], // 教练列表
    campusList: [], // 校区列表
    
    // 弹窗相关
    showCoachModal: false, // 是否显示教练表单弹窗
    editingCoach: null, // 当前正在编辑的教练
    coachForm: { // 教练表单数据
      name: '',
      gender: '',
      genderIndex: 0,
      phone: '',
      campus: '',
      campusIndex: 0,
      subjects: '',
      intro: ''
    },
    showDetailModal: false, // 是否显示教练详情弹窗
    currentCoach: {} // 当前查看详情的教练
  },
  
  onLoad() {
    this.loadCampusList();
    this.loadCoachList();
  },
  
  // 搜索教练
  onSearch(e) {
    const searchKey = e.detail.value;
    this.setData({ searchKey });
    this.loadCoachList();
  },
  
  // 加载校区列表
  loadCampusList() {
    // 模拟从服务器获取数据
    // 实际项目中应该调用API获取数据
    const mockCampuses = [
      {
        id: 1,
        name: '总部校区'
      },
      {
        id: 2,
        name: '东区校区'
      },
      {
        id: 3,
        name: '南区校区'
      }
    ];
    
    this.setData({
      campusList: mockCampuses
    });
  },
  
  // 加载教练列表
  loadCoachList() {
    // 模拟从服务器获取数据
    // 实际项目中应该调用API获取数据
    const mockCoaches = [
      {
        id: 1,
        name: '张教练',
        gender: 'male',
        phone: '13800138000',
        campus: '总部校区',
        subjects: '数学, 物理',
        courseCount: 5,
        studentCount: 48,
        intro: '毕业于北京大学，有5年教学经验，擅长数学和物理教学。'
      },
      {
        id: 2,
        name: '李教练',
        gender: 'female',
        phone: '13900139000',
        campus: '东区校区',
        subjects: '英语, 语文',
        courseCount: 3,
        studentCount: 36,
        intro: '毕业于清华大学，有3年教学经验，擅长英语和语文教学。'
      },
      {
        id: 3,
        name: '王教练',
        gender: 'male',
        phone: '13700137000',
        campus: '南区校区',
        subjects: '编程, 数学',
        courseCount: 4,
        studentCount: 42,
        intro: '毕业于浙江大学，有4年教学经验，擅长编程和数学教学。'
      }
    ];
    
    // 根据搜索关键词过滤
    let filteredCoaches = mockCoaches;
    if (this.data.searchKey) {
      const key = this.data.searchKey.toLowerCase();
      filteredCoaches = mockCoaches.filter(coach => 
        coach.name.toLowerCase().includes(key) || 
        coach.subjects.toLowerCase().includes(key) ||
        coach.campus.toLowerCase().includes(key)
      );
    }
    
    this.setData({
      coachList: filteredCoaches
    });
  },
  
  // 显示添加教练弹窗
  showAddCoach() {
    this.setData({
      showCoachModal: true,
      editingCoach: null,
      coachForm: {
        name: '',
        gender: '',
        genderIndex: 0,
        phone: '',
        campus: '',
        campusIndex: 0,
        subjects: '',
        intro: ''
      }
    });
  },
  
  // 显示编辑教练弹窗
  editCoach(e) {
    const id = e.currentTarget.dataset.id;
    const coach = this.data.coachList.find(c => c.id === id);
    if (coach) {
      // 找到对应的校区索引
      const campusIndex = this.data.campusList.findIndex(c => c.name === coach.campus);
      
      this.setData({
        showCoachModal: true,
        editingCoach: coach,
        coachForm: {
          name: coach.name,
          gender: coach.gender,
          genderIndex: coach.gender === 'male' ? 0 : 1,
          phone: coach.phone,
          campus: coach.campus,
          campusIndex: campusIndex !== -1 ? campusIndex : 0,
          subjects: coach.subjects,
          intro: coach.intro || ''
        }
      });
    }
  },
  
  // 隐藏教练表单弹窗
  hideCoachModal() {
    this.setData({
      showCoachModal: false
    });
  },
  
  // 性别选择变化
  onGenderChange(e) {
    const genderIndex = parseInt(e.detail.value);
    const gender = genderIndex === 0 ? 'male' : 'female';
    
    this.setData({
      'coachForm.genderIndex': genderIndex,
      'coachForm.gender': gender
    });
  },
  
  // 校区选择变化
  onCampusChange(e) {
    const campusIndex = parseInt(e.detail.value);
    const campus = this.data.campusList[campusIndex].name;
    
    this.setData({
      'coachForm.campusIndex': campusIndex,
      'coachForm.campus': campus
    });
  },
  
  // 教练表单输入变化
  onCoachFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`coachForm.${field}`]: value
    });
  },
  
  // 保存教练
  saveCoach() {
    const form = this.data.coachForm;
    
    // 表单验证
    if (!form.name) {
      wx.showToast({
        title: '请输入教练姓名',
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
    
    if (!form.phone) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      });
      return;
    }
    
    if (!form.campus) {
      wx.showToast({
        title: '请选择所属校区',
        icon: 'none'
      });
      return;
    }
    
    if (!form.subjects) {
      wx.showToast({
        title: '请输入教学科目',
        icon: 'none'
      });
      return;
    }
    
    // 构造教练数据
    const coachData = {
      name: form.name,
      gender: form.gender,
      phone: form.phone,
      campus: form.campus,
      subjects: form.subjects,
      intro: form.intro,
      courseCount: 0,
      studentCount: 0
    };
    
    // 编辑模式
    if (this.data.editingCoach) {
      coachData.id = this.data.editingCoach.id;
      coachData.courseCount = this.data.editingCoach.courseCount;
      coachData.studentCount = this.data.editingCoach.studentCount;
      
      // 更新教练列表
      const index = this.data.coachList.findIndex(c => c.id === coachData.id);
      if (index !== -1) {
        const newList = [...this.data.coachList];
        newList[index] = coachData;
        this.setData({
          coachList: newList
        });
      }
    } 
    // 添加模式
    else {
      coachData.id = Date.now(); // 生成临时ID
      
      // 添加到教练列表
      this.setData({
        coachList: [coachData, ...this.data.coachList]
      });
    }
    
    // 关闭弹窗并提示
    this.hideCoachModal();
    wx.showToast({
      title: this.data.editingCoach ? '编辑成功' : '添加成功',
      icon: 'success'
    });
  },
  
  // 删除教练
  deleteCoach(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该教练吗？',
      success: res => {
        if (res.confirm) {
          // 从列表中删除
          const newList = this.data.coachList.filter(c => c.id !== id);
          this.setData({
            coachList: newList
          });
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },
  
  // 显示教练详情
  showCoachDetail(e) {
    const id = e.currentTarget.dataset.id;
    const coach = this.data.coachList.find(c => c.id === id);
    if (coach) {
      this.setData({
        showDetailModal: true,
        currentCoach: coach
      });
    }
  },
  
  // 隐藏教练详情弹窗
  hideDetailModal() {
    this.setData({
      showDetailModal: false
    });
  }
}) 