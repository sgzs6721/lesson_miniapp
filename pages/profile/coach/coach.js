// coach.js
const api = require('../../../utils/api.js');
const auth = require('../../../utils/auth.js');
const campusCache = require('../../../utils/campus-cache.js');

Page({
  data: {
    searchKey: '', // 搜索关键词
    coachList: [], // 教练列表
    campusList: [], // 校区列表
    loading: false, // 加载状态

    // 分页相关
    pageNum: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,

    // 校区筛选
    selectedCampusId: null,
    selectedCampusIndex: 0,
    showCampusFilter: false,

    // 弹窗相关
    showCoachModal: false, // 是否显示教练表单弹窗
    editingCoach: null, // 当前正在编辑的教练
    coachForm: { // 教练表单数据
      name: '',
      gender: 'MALE',
      genderIndex: 0,
      age: '',
      phone: '',
      jobTitle: '初级教练',
      jobTitleIndex: 0,
      hireDate: '',
      experience: '',
      certifications: '',
      status: 'ACTIVE',
      statusIndex: 0,
      campusId: null,
      campusIndex: 0,
      // 薪资信息
      baseSalary: '',
      socialInsurance: '',
      classFee: '',
      performanceBonus: '',
      commission: '',
      dividend: ''
    },
    showDetailModal: false, // 是否显示教练详情弹窗
    currentCoach: {}, // 当前查看详情的教练

    // 选项数据
    genderOptions: ['男', '女'],
    genderValues: ['MALE', 'FEMALE'],
    jobTitleOptions: ['高级教练', '中级教练', '初级教练'],
    statusOptions: ['在职', '休假中', '已离职'],
    statusValues: ['ACTIVE', 'VACATION', 'RESIGNED']
  },
  
  async onLoad() {
    // 检查登录状态
    if (!auth.checkLoginAndRedirect()) {
      return;
    }
    await this.loadCampusList();
    this.initCurrentCampus();
    this.loadCoachList();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadCoachList(true);
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadCoachList();
    }
  },
  
  // 搜索教练
  onSearch(e) {
    const searchKey = e.detail.value;
    this.setData({
      searchKey,
      pageNum: 1,
      coachList: [],
      hasMore: true
    });
    this.loadCoachList(true);
  },

  // 加载校区列表
  async loadCampusList() {
    try {
      const campusList = await campusCache.getCampusList();

      this.setData({
        campusList: campusList
      });

      if (campusList.length === 0) {
        wx.showToast({
          title: '暂无可用校区',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('Load campus list error:', error);
      wx.showToast({
        title: '获取校区列表失败',
        icon: 'none'
      });
    }
  },

  // 初始化当前校区
  initCurrentCampus() {
    const currentCampus = campusCache.getCurrentCampus();
    if (currentCampus && this.data.campusList.length > 0) {
      // 找到当前校区在列表中的索引
      const campusIndex = this.data.campusList.findIndex(c => c.id === currentCampus.id);
      if (campusIndex !== -1) {
        this.setData({
          selectedCampusId: currentCampus.id,
          selectedCampusIndex: campusIndex
        });
      } else {
        // 如果当前校区不在列表中，选择第一个营业中的校区
        const firstOperating = campusCache.getFirstOperatingCampus(this.data.campusList);
        if (firstOperating) {
          campusCache.setCurrentCampus(firstOperating);
          const index = this.data.campusList.findIndex(c => c.id === firstOperating.id);
          this.setData({
            selectedCampusId: firstOperating.id,
            selectedCampusIndex: index
          });
        }
      }
    } else if (this.data.campusList.length > 0) {
      // 如果没有当前校区，选择第一个营业中的校区
      const firstOperating = campusCache.getFirstOperatingCampus(this.data.campusList);
      if (firstOperating) {
        campusCache.setCurrentCampus(firstOperating);
        const index = this.data.campusList.findIndex(c => c.id === firstOperating.id);
        this.setData({
          selectedCampusId: firstOperating.id,
          selectedCampusIndex: index
        });
      }
    }
  },

  // 校区筛选
  onCampusFilterChange(e) {
    const index = e.detail.value;
    const selectedCampus = this.data.campusList[index];

    // 保存到全局校区选择
    campusCache.setCurrentCampus(selectedCampus);

    this.setData({
      selectedCampusIndex: index,
      selectedCampusId: selectedCampus.id,
      pageNum: 1,
      coachList: [],
      hasMore: true
    });

    this.loadCoachList(true);
  },
  
  // 加载教练列表
  async loadCoachList(refresh = false) {
    // 如果没有选择校区，不加载数据
    if (!this.data.selectedCampusId) {
      console.log('No campus selected, skipping coach list load');
      return;
    }

    if (refresh) {
      this.setData({
        pageNum: 1,
        coachList: [],
        hasMore: true
      });
    }

    this.setData({ loading: true });

    try {
      const response = await api.getCoachList(
        this.data.pageNum,
        this.data.pageSize,
        this.data.selectedCampusId
      );
      console.log('Coach list response:', response);

      if (response.code === 200) {
        const { data } = response;
        const newList = refresh ? data.list : [...this.data.coachList, ...data.list];

        this.setData({
          coachList: newList,
          total: data.total,
          pageNum: this.data.pageNum + 1,
          hasMore: data.list.length === this.data.pageSize && newList.length < data.total
        });
      } else {
        wx.showToast({
          title: response.message || '获取教练列表失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('Load coach list error:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }
  },
  
  // 显示添加教练弹窗
  showAddCoach() {
    // 获取当前日期作为默认入职日期
    const today = new Date();
    const dateStr = today.getFullYear() + '-' +
                   String(today.getMonth() + 1).padStart(2, '0') + '-' +
                   String(today.getDate()).padStart(2, '0');

    // 默认选择当前选中的校区
    const defaultCampusId = this.data.selectedCampusId;
    const defaultCampusIndex = this.data.selectedCampusIndex;

    this.setData({
      showCoachModal: true,
      editingCoach: null,
      coachForm: {
        name: '',
        gender: 'MALE',
        genderIndex: 0,
        age: '',
        phone: '',
        jobTitle: '初级教练',
        jobTitleIndex: 0,
        hireDate: dateStr,
        experience: '',
        certifications: '',
        status: 'ACTIVE',
        statusIndex: 0,
        campusId: defaultCampusId,
        campusIndex: defaultCampusIndex,
        // 薪资信息
        baseSalary: '',
        socialInsurance: '',
        classFee: '',
        performanceBonus: '',
        commission: '',
        dividend: ''
      }
    });
  },
  
  // 显示编辑教练弹窗
  async editCoach(e) {
    const id = e.currentTarget.dataset.id;
    const coach = this.data.coachList.find(c => c.id === id);
    if (coach) {
      wx.showLoading({
        title: '加载中...'
      });

      try {
        // 获取教练详细信息，包括薪资信息
        const response = await api.getCoachDetail(id, coach.campusId);
        wx.hideLoading();

        if (response.code === 200) {
          const coachDetail = response.data;

          // 获取校区名称
          coachDetail.campusName = await campusCache.getCampusNameById(coachDetail.campusId);

          // 找到对应的索引
          const genderIndex = this.data.genderValues.indexOf(coachDetail.gender);
          const jobTitleIndex = this.data.jobTitleOptions.indexOf(coachDetail.jobTitle);
          const statusIndex = this.data.statusValues.indexOf(coachDetail.status);

          this.setData({
            showCoachModal: true,
            editingCoach: coachDetail,
            coachForm: {
              name: coachDetail.name,
              gender: coachDetail.gender,
              genderIndex: genderIndex !== -1 ? genderIndex : 0,
              age: coachDetail.age ? coachDetail.age.toString() : '',
              phone: coachDetail.phone,
              jobTitle: coachDetail.jobTitle,
              jobTitleIndex: jobTitleIndex !== -1 ? jobTitleIndex : 0,
              hireDate: coachDetail.hireDate,
              experience: coachDetail.experience ? coachDetail.experience.toString() : '',
              certifications: coachDetail.certifications ? coachDetail.certifications.join('\n') : '',
              status: coachDetail.status,
              statusIndex: statusIndex !== -1 ? statusIndex : 0,
              // 编辑时保留原有校区，不允许修改
              campusId: coachDetail.campusId,
              campusName: coachDetail.campusName,
              // 薪资信息
              baseSalary: coachDetail.salary ? coachDetail.salary.baseSalary.toString() : '',
              socialInsurance: coachDetail.salary ? coachDetail.salary.socialInsurance.toString() : '',
              classFee: coachDetail.salary ? coachDetail.salary.classFee.toString() : '',
              performanceBonus: coachDetail.salary ? coachDetail.salary.performanceBonus.toString() : '',
              commission: coachDetail.salary ? coachDetail.salary.commission.toString() : '',
              dividend: coachDetail.salary ? coachDetail.salary.dividend.toString() : ''
            }
          });
        } else {
          wx.showToast({
            title: response.message || '获取教练详情失败',
            icon: 'none'
          });
        }
      } catch (error) {
        wx.hideLoading();
        console.error('Get coach detail error:', error);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
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
    const gender = this.data.genderValues[genderIndex];

    this.setData({
      'coachForm.genderIndex': genderIndex,
      'coachForm.gender': gender
    });
  },

  // 职位选择变化
  onJobTitleChange(e) {
    const jobTitleIndex = parseInt(e.detail.value);
    const jobTitle = this.data.jobTitleOptions[jobTitleIndex];

    this.setData({
      'coachForm.jobTitleIndex': jobTitleIndex,
      'coachForm.jobTitle': jobTitle
    });
  },

  // 状态选择变化
  onStatusChange(e) {
    const statusIndex = parseInt(e.detail.value);
    const status = this.data.statusValues[statusIndex];

    this.setData({
      'coachForm.statusIndex': statusIndex,
      'coachForm.status': status
    });
  },

  // 校区选择变化
  onCampusChange(e) {
    const campusIndex = parseInt(e.detail.value);
    const campus = this.data.campusList[campusIndex];

    this.setData({
      'coachForm.campusIndex': campusIndex,
      'coachForm.campusId': campus.id
    });
  },

  // 入职日期选择变化
  onHireDateChange(e) {
    this.setData({
      'coachForm.hireDate': e.detail.value
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
  async saveCoach() {
    const form = this.data.coachForm;

    // 表单验证
    if (!form.name.trim()) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }

    if (!form.phone.trim()) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      });
      return;
    }

    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(form.phone.trim())) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    if (!form.campusId) {
      wx.showToast({
        title: '请选择所属校区',
        icon: 'none'
      });
      return;
    }

    if (!form.age || isNaN(form.age) || parseInt(form.age) <= 0) {
      wx.showToast({
        title: '请输入正确的年龄',
        icon: 'none'
      });
      return;
    }

    if (!form.experience || isNaN(form.experience) || parseInt(form.experience) < 0) {
      wx.showToast({
        title: '请输入正确的教龄',
        icon: 'none'
      });
      return;
    }

    // 构造教练数据
    const coachData = {
      name: form.name.trim(),
      gender: form.gender,
      age: parseInt(form.age),
      phone: form.phone.trim(),
      jobTitle: form.jobTitle,
      hireDate: form.hireDate,
      experience: parseInt(form.experience),
      certifications: form.certifications ? form.certifications.split('\n').filter(cert => cert.trim()) : [],
      status: form.status,
      campusId: form.campusId,
      baseSalary: form.baseSalary ? parseFloat(form.baseSalary) : 0,
      socialInsurance: form.socialInsurance ? parseFloat(form.socialInsurance) : 0,
      classFee: form.classFee ? parseFloat(form.classFee) : 0,
      performanceBonus: form.performanceBonus ? parseFloat(form.performanceBonus) : 0,
      commission: form.commission ? parseFloat(form.commission) : 0,
      dividend: form.dividend ? parseFloat(form.dividend) : 0
    };

    wx.showLoading({
      title: this.data.editingCoach ? '更新中...' : '创建中...'
    });

    try {
      let response;

      // 编辑模式
      if (this.data.editingCoach) {
        coachData.id = this.data.editingCoach.id;
        response = await api.updateCoach(coachData);
      }
      // 添加模式
      else {
        response = await api.createCoach(coachData);
      }

      wx.hideLoading();

      if (response.code === 200) {
        // 关闭弹窗并提示
        this.hideCoachModal();
        wx.showToast({
          title: this.data.editingCoach ? '更新成功' : '创建成功',
          icon: 'success'
        });

        // 刷新列表
        this.loadCoachList(true);
      } else {
        wx.showToast({
          title: response.message || '操作失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('Save coach error:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    }
  },
  
  // 删除教练
  deleteCoach(e) {
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除该教练吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...'
          });

          try {
            const response = await api.deleteCoach(id);
            wx.hideLoading();

            if (response.code === 200) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });

              // 刷新列表
              this.loadCoachList(true);
            } else {
              wx.showToast({
                title: response.message || '删除失败',
                icon: 'none'
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('Delete coach error:', error);
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },
  
  // 显示教练详情
  async showCoachDetail(e) {
    const id = e.currentTarget.dataset.id;
    const coach = this.data.coachList.find(c => c.id === id);
    if (coach) {
      wx.showLoading({
        title: '加载中...'
      });

      try {
        // 获取教练详细信息，包括薪资信息
        const response = await api.getCoachDetail(id, coach.campusId);
        wx.hideLoading();

        if (response.code === 200) {
          const coachDetail = response.data;

          // 获取校区名称
          coachDetail.campusName = await campusCache.getCampusNameById(coachDetail.campusId);

          // 处理证书显示
          if (coachDetail.certifications && Array.isArray(coachDetail.certifications)) {
            coachDetail.certificationsText = coachDetail.certifications.join('、');
          } else {
            coachDetail.certificationsText = '无';
          }

          console.log('Coach detail:', coachDetail);

          this.setData({
            showDetailModal: true,
            currentCoach: coachDetail
          });
        } else {
          wx.showToast({
            title: response.message || '获取教练详情失败',
            icon: 'none'
          });
        }
      } catch (error) {
        wx.hideLoading();
        console.error('Get coach detail error:', error);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    }
  },
  
  // 隐藏教练详情弹窗
  hideDetailModal() {
    this.setData({
      showDetailModal: false
    });
  }
}) 
