const api = require('../../../utils/api.js');
const auth = require('../../../utils/auth.js');

Page({
  data: {
    searchKey: '', // 搜索关键词
    campusList: [], // 校区列表
    loading: false, // 加载状态

    // 分页相关
    pageNum: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,

    // 弹窗相关
    showCampusModal: false, // 是否显示校区表单弹窗
    editingCampus: null, // 当前正在编辑的校区
    campusForm: { // 校区表单数据
      name: '',
      address: '',
      monthlyRent: '',
      propertyFee: '',
      utilityFee: '',
      status: 'OPERATING' // 默认运营中
    },
    showDetailModal: false, // 是否显示校区详情弹窗
    currentCampus: {} // 当前查看详情的校区
  },
  
  onLoad() {
    // 检查登录状态
    if (!auth.checkLoginAndRedirect()) {
      return;
    }
    this.loadCampusList();
  },
  
  // 下拉刷新
  onPullDownRefresh() {
    this.loadCampusList(true);
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadCampusList();
    }
  },

  // 搜索校区
  onSearch(e) {
    const searchKey = e.detail.value;
    this.setData({ searchKey });
    // 搜索功能暂时使用本地过滤，后续可以改为服务端搜索
    this.filterCampusList();
  },

  // 本地过滤校区列表（临时方案）
  filterCampusList() {
    // 注意：这里使用本地过滤，实际项目中建议使用服务端搜索
    // 可以添加搜索API接口来实现服务端搜索
    if (!this.data.searchKey) {
      this.loadCampusList(true);
      return;
    }

    const key = this.data.searchKey.toLowerCase();
    const filteredList = this.data.campusList.filter(campus =>
      campus.name.toLowerCase().includes(key) ||
      campus.address.toLowerCase().includes(key) ||
      (campus.managerName && campus.managerName.toLowerCase().includes(key))
    );

    this.setData({
      campusList: filteredList
    });
  },
  
  // 加载校区列表
  async loadCampusList(refresh = false) {
    if (this.data.loading) return;

    // 如果是刷新，重置分页
    if (refresh) {
      this.setData({
        pageNum: 1,
        campusList: [],
        hasMore: true
      });
    }

    this.setData({ loading: true });

    try {
      const response = await api.getCampusList(this.data.pageNum, this.data.pageSize);
      console.log('Campus list response:', response);

      if (response.code === 200) {
        const { data } = response;
        const newList = refresh ? data.list : [...this.data.campusList, ...data.list];

        this.setData({
          campusList: newList,
          total: data.total,
          pageNum: this.data.pageNum + 1,
          hasMore: data.list.length === this.data.pageSize && newList.length < data.total
        });
      } else {
        wx.showToast({
          title: response.message || '获取校区列表失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('Load campus list error:', error);
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
  
  // 显示添加校区弹窗
  showAddCampus() {
    this.setData({
      showCampusModal: true,
      editingCampus: null,
      campusForm: {
        name: '',
        address: '',
        monthlyRent: '',
        propertyFee: '',
        utilityFee: '',
        status: 'OPERATING'
      }
    });
  },
  
  // 显示编辑校区弹窗
  async editCampus(e) {
    const id = e.currentTarget.dataset.id;

    wx.showLoading({
      title: '加载中...'
    });

    try {
      // 获取校区详情
      const response = await api.getCampusDetail(id);
      wx.hideLoading();

      if (response.code === 200) {
        const campus = response.data;
        this.setData({
          showCampusModal: true,
          editingCampus: campus,
          campusForm: {
            name: campus.name,
            address: campus.address,
            monthlyRent: campus.monthlyRent ? campus.monthlyRent.toString() : '',
            propertyFee: campus.propertyFee ? campus.propertyFee.toString() : '',
            utilityFee: campus.utilityFee ? campus.utilityFee.toString() : '',
            status: campus.status || 'OPERATING'
          }
        });
      } else {
        wx.showToast({
          title: response.message || '获取校区详情失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('Get campus detail error:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
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

  // 状态选择变化
  onStatusChange(e) {
    const statusIndex = e.detail.value;
    const status = statusIndex === '0' ? 'OPERATING' : 'CLOSED';
    this.setData({
      'campusForm.status': status
    });
  },
  
  // 保存校区
  async saveCampus() {
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

    wx.showLoading({
      title: this.data.editingCampus ? '更新中...' : '添加中...'
    });

    try {
      // 构造校区数据 - 只包含API支持的字段
      const campusData = {
        name: form.name,
        address: form.address,
        status: form.status || 'OPERATING',
        monthlyRent: form.monthlyRent ? parseFloat(form.monthlyRent) : 0,
        propertyFee: form.propertyFee ? parseFloat(form.propertyFee) : 0,
        utilityFee: form.utilityFee ? parseFloat(form.utilityFee) : 0
      };

      let response;
      // 编辑模式
      if (this.data.editingCampus) {
        campusData.id = this.data.editingCampus.id.toString(); // 确保ID是字符串
        response = await api.updateCampus(campusData);
      }
      // 添加模式
      else {
        response = await api.addCampus(campusData);
      }

      wx.hideLoading();

      if (response.code === 200) {
        // 关闭弹窗并提示
        this.hideCampusModal();
        wx.showToast({
          title: this.data.editingCampus ? '编辑成功' : '添加成功',
          icon: 'success'
        });

        // 重新加载列表
        this.loadCampusList(true);
      } else {
        wx.showToast({
          title: response.message || '操作失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('Save campus error:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    }
  },
  
  // 删除校区
  deleteCampus(e) {
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除该校区吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...'
          });

          try {
            const response = await api.deleteCampus(id);
            wx.hideLoading();

            if (response.code === 200) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });

              // 重新加载列表
              this.loadCampusList(true);
            } else {
              wx.showToast({
                title: response.message || '删除失败',
                icon: 'none'
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('Delete campus error:', error);
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            });
          }
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
