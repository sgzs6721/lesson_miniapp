Page({
  data: {
    searchKey: '', // 搜索关键词
    campusList: [], // 校区列表
    
    // 弹窗相关
    showCampusModal: false, // 是否显示校区表单弹窗
    editingCampus: null, // 当前正在编辑的校区
    campusForm: { // 校区表单数据
      name: '',
      address: '',
      phone: '',
      manager: '',
      remark: ''
    },
    showDetailModal: false, // 是否显示校区详情弹窗
    currentCampus: {} // 当前查看详情的校区
  },
  
  onLoad() {
    this.loadCampusList();
  },
  
  // 搜索校区
  onSearch(e) {
    const searchKey = e.detail.value;
    this.setData({ searchKey });
    this.loadCampusList();
  },
  
  // 加载校区列表
  loadCampusList() {
    // 模拟从服务器获取数据
    // 实际项目中应该调用API获取数据
    const mockCampuses = [
      {
        id: 1,
        name: '总部校区',
        address: '北京市海淀区中关村大街1号',
        phone: '010-12345678',
        manager: '张经理',
        studentCount: 120,
        coachCount: 8,
        courseCount: 15,
        remark: '总部校区，配备完整教学设施'
      },
      {
        id: 2,
        name: '东区校区',
        address: '北京市朝阳区建国路88号',
        phone: '010-87654321',
        manager: '李经理',
        studentCount: 80,
        coachCount: 5,
        courseCount: 10,
        remark: '东区新校区，环境优美'
      },
      {
        id: 3,
        name: '南区校区',
        address: '北京市丰台区丰台路66号',
        phone: '010-55556666',
        manager: '王经理',
        studentCount: 60,
        coachCount: 4,
        courseCount: 8,
        remark: ''
      }
    ];
    
    // 根据搜索关键词过滤
    let filteredCampuses = mockCampuses;
    if (this.data.searchKey) {
      const key = this.data.searchKey.toLowerCase();
      filteredCampuses = mockCampuses.filter(campus => 
        campus.name.toLowerCase().includes(key) || 
        campus.address.toLowerCase().includes(key) ||
        campus.manager.toLowerCase().includes(key)
      );
    }
    
    this.setData({
      campusList: filteredCampuses
    });
  },
  
  // 显示添加校区弹窗
  showAddCampus() {
    this.setData({
      showCampusModal: true,
      editingCampus: null,
      campusForm: {
        name: '',
        address: '',
        phone: '',
        manager: '',
        remark: ''
      }
    });
  },
  
  // 显示编辑校区弹窗
  editCampus(e) {
    const id = e.currentTarget.dataset.id;
    const campus = this.data.campusList.find(c => c.id === id);
    if (campus) {
      this.setData({
        showCampusModal: true,
        editingCampus: campus,
        campusForm: {
          name: campus.name,
          address: campus.address,
          phone: campus.phone,
          manager: campus.manager,
          remark: campus.remark || ''
        }
      });
    }
  },
  
  // 隐藏校区表单弹窗
  hideCampusModal() {
    this.setData({
      showCampusModal: false
    });
  },
  
  // 校区表单输入变化
  onCampusFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`campusForm.${field}`]: value
    });
  },
  
  // 保存校区
  saveCampus() {
    const form = this.data.campusForm;
    
    // 表单验证
    if (!form.name) {
      wx.showToast({
        title: '请输入校区名称',
        icon: 'none'
      });
      return;
    }
    
    if (!form.address) {
      wx.showToast({
        title: '请输入详细地址',
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
    
    if (!form.manager) {
      wx.showToast({
        title: '请输入负责人姓名',
        icon: 'none'
      });
      return;
    }
    
    // 构造校区数据
    const campusData = {
      name: form.name,
      address: form.address,
      phone: form.phone,
      manager: form.manager,
      remark: form.remark,
      studentCount: 0,
      coachCount: 0,
      courseCount: 0
    };
    
    // 编辑模式
    if (this.data.editingCampus) {
      campusData.id = this.data.editingCampus.id;
      campusData.studentCount = this.data.editingCampus.studentCount;
      campusData.coachCount = this.data.editingCampus.coachCount;
      campusData.courseCount = this.data.editingCampus.courseCount;
      
      // 更新校区列表
      const index = this.data.campusList.findIndex(c => c.id === campusData.id);
      if (index !== -1) {
        const newList = [...this.data.campusList];
        newList[index] = campusData;
        this.setData({
          campusList: newList
        });
      }
    } 
    // 添加模式
    else {
      campusData.id = Date.now(); // 生成临时ID
      
      // 添加到校区列表
      this.setData({
        campusList: [campusData, ...this.data.campusList]
      });
    }
    
    // 关闭弹窗并提示
    this.hideCampusModal();
    wx.showToast({
      title: this.data.editingCampus ? '编辑成功' : '添加成功',
      icon: 'success'
    });
  },
  
  // 删除校区
  deleteCampus(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该校区吗？',
      success: res => {
        if (res.confirm) {
          // 从列表中删除
          const newList = this.data.campusList.filter(c => c.id !== id);
          this.setData({
            campusList: newList
          });
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },
  
  // 显示校区详情
  showCampusDetail(e) {
    const id = e.currentTarget.dataset.id;
    const campus = this.data.campusList.find(c => c.id === id);
    if (campus) {
      this.setData({
        showDetailModal: true,
        currentCampus: campus
      });
    }
  },
  
  // 隐藏校区详情弹窗
  hideDetailModal() {
    this.setData({
      showDetailModal: false
    });
  }
}) 