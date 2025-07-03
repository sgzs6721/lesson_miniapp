// user.js
const api = require('../../../utils/api.js');
const auth = require('../../../utils/auth.js');
const campusCache = require('../../../utils/campus-cache.js');

Page({
  data: {
    searchKey: '', // 搜索关键词
    userList: [], // 用户列表
    campusList: [], // 校区列表
    loading: false, // 加载状态

    // 分页相关
    pageNum: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,

    // 角色选项 - 只允许创建协同管理员和校区管理员
    roleOptions: [
      { label: '协同管理员', value: 'COLLABORATOR' },
      { label: '校区管理员', value: 'CAMPUS_ADMIN' }
    ],
    statusOptions: [
      { label: '启用', value: 'ENABLED' },
      { label: '禁用', value: 'DISABLED' }
    ],
    
    // 弹窗相关
    showUserModal: false, // 是否显示用户表单弹窗
    editingUser: null, // 当前正在编辑的用户
    userForm: { // 用户表单数据
      realName: '',
      phone: '',
      password: '',
      role: 'COLLABORATOR',
      roleIndex: 0,
      campusId: null,
      campusIndex: 0,
      status: 'ENABLED',
      statusIndex: 0
    },
    showDetailModal: false, // 是否显示用户详情弹窗
    currentUser: {} // 当前查看详情的用户
  },
  
  onLoad() {
    // 检查登录状态
    if (!auth.checkLoginAndRedirect()) {
      return;
    }
    this.loadCampusList();
    this.loadUserList();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadUserList(true);
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadUserList();
    }
  },
  
  // 搜索用户
  onSearch(e) {
    const searchKey = e.detail.value;
    this.setData({ searchKey });
    this.loadUserList();
  },
  
  // 加载校区列表
  async loadCampusList() {
    try {
      const campusList = await campusCache.getCampusList();

      this.setData({
        campusList: campusList // 不添加"全部校区"选项，校区管理员必须选择具体校区
      });
    } catch (error) {
      console.error('Load campus list error:', error);
      wx.showToast({
        title: '获取校区列表失败',
        icon: 'none'
      });
    }
  },
  
  // 加载用户列表
  async loadUserList(refresh = false) {
    if (this.data.loading) return;

    // 如果是刷新，重置分页
    if (refresh) {
      this.setData({
        pageNum: 1,
        userList: [],
        hasMore: true
      });
    }

    this.setData({ loading: true });

    try {
      const response = await api.getUserList(this.data.pageNum, this.data.pageSize);
      console.log('User list response:', response);

      if (response.code === 200) {
        const { data } = response;
        const newList = refresh ? data.list : [...this.data.userList, ...data.list];

        this.setData({
          userList: newList,
          total: data.total,
          pageNum: this.data.pageNum + 1,
          hasMore: data.list.length === this.data.pageSize && newList.length < data.total
        });
      } else {
        wx.showToast({
          title: response.message || '获取用户列表失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('Load user list error:', error);
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
  
  // 显示添加用户弹窗
  showAddUser() {
    this.setData({
      showUserModal: true,
      editingUser: null,
      userForm: {
        realName: '',
        phone: '',
        password: '',
        role: 'COLLABORATOR',
        roleIndex: 0,
        campusId: null,
        campusIndex: 0,
        status: 'ENABLED',
        statusIndex: 0
      }
    });
  },
  
  // 显示编辑用户弹窗
  editUser(e) {
    const id = e.currentTarget.dataset.id;
    const user = this.data.userList.find(u => u.id === id);
    if (user) {
      // 找到对应的角色索引
      const roleIndex = this.data.roleOptions.findIndex(r => r.label === user.role.name);
      // 找到对应的校区索引
      const campusIndex = this.data.campusList.findIndex(c => c.id === (user.campus ? user.campus.id : null));
      // 找到对应的状态索引
      const statusIndex = this.data.statusOptions.findIndex(s => s.value === user.status);

      this.setData({
        showUserModal: true,
        editingUser: user,
        userForm: {
          realName: user.realName,
          phone: user.phone,
          password: '', // 编辑时不显示密码
          role: this.data.roleOptions[roleIndex]?.value || 'COLLABORATOR',
          roleIndex: roleIndex !== -1 ? roleIndex : 0,
          campusId: user.campus ? user.campus.id : null,
          campusIndex: campusIndex !== -1 ? campusIndex : 0,
          status: user.status,
          statusIndex: statusIndex !== -1 ? statusIndex : 0
        }
      });
    }
  },
  
  // 隐藏用户表单弹窗
  hideUserModal() {
    this.setData({
      showUserModal: false
    });
  },
  
  // 角色选择变化
  onRoleChange(e) {
    const roleIndex = parseInt(e.detail.value);
    const role = this.data.roleOptions[roleIndex];
    
    this.setData({
      'userForm.roleIndex': roleIndex,
      'userForm.role': role
    });
  },
  
  // 校区选择变化
  onCampusChange(e) {
    const campusIndex = parseInt(e.detail.value);
    const campus = this.data.campusList[campusIndex].name;
    
    this.setData({
      'userForm.campusIndex': campusIndex,
      'userForm.campus': campus
    });
  },
  
  // 状态选择变化
  onStatusChange(e) {
    const statusIndex = parseInt(e.detail.value);
    const status = statusIndex === 0 ? 'active' : 'inactive';
    
    this.setData({
      'userForm.statusIndex': statusIndex,
      'userForm.status': status
    });
  },
  
  // 用户表单输入变化
  onUserFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`userForm.${field}`]: value
    });
  },

  // 角色选择变化
  onRoleChange(e) {
    const roleIndex = parseInt(e.detail.value);
    const role = this.data.roleOptions[roleIndex];

    // 如果切换到协同管理员，清除校区选择
    const updateData = {
      'userForm.roleIndex': roleIndex,
      'userForm.role': role.value
    };

    if (role.value === 'COLLABORATOR') {
      updateData['userForm.campusId'] = null;
      updateData['userForm.campusIndex'] = 0;
    }

    this.setData(updateData);
  },

  // 校区选择变化
  onCampusChange(e) {
    const campusIndex = parseInt(e.detail.value);
    const campus = this.data.campusList[campusIndex];
    this.setData({
      'userForm.campusIndex': campusIndex,
      'userForm.campusId': campus.id
    });
  },

  // 状态选择变化
  onStatusChange(e) {
    const statusIndex = parseInt(e.detail.value);
    const status = this.data.statusOptions[statusIndex];
    this.setData({
      'userForm.statusIndex': statusIndex,
      'userForm.status': status.value
    });
  },

  // 验证手机号格式
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  },

  // 保存用户
  async saveUser() {
    const form = this.data.userForm;

    // 表单验证
    if (!form.realName) {
      wx.showToast({
        title: '请输入真实姓名',
        icon: 'none'
      });
      return;
    }

    if (!form.phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      });
      return;
    }

    if (!this.validatePhone(form.phone)) {
      wx.showToast({
        title: '请输入正确的手机号格式',
        icon: 'none'
      });
      return;
    }

    if (!form.role) {
      wx.showToast({
        title: '请选择角色',
        icon: 'none'
      });
      return;
    }

    // 校区管理员必须选择具体校区
    if (form.role === 'CAMPUS_ADMIN' && !form.campusId) {
      wx.showToast({
        title: '校区管理员必须选择具体校区',
        icon: 'none'
      });
      return;
    }

    if (!this.data.editingUser && !form.password) {
      wx.showToast({
        title: '请输入初始密码',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: this.data.editingUser ? '更新中...' : '添加中...'
    });

    try {
      // 构造用户数据
      const userData = {
        realName: form.realName,
        phone: form.phone,
        role: form.role,
        status: form.status,
        campusId: form.campusId
      };

      // 添加模式需要密码
      if (!this.data.editingUser) {
        userData.password = form.password;
      }

      let response;
      // 编辑模式
      if (this.data.editingUser) {
        userData.id = this.data.editingUser.id;
        response = await api.updateUser(userData);
      }
      // 添加模式
      else {
        response = await api.createUser(userData);
      }

      wx.hideLoading();

      if (response.code === 200) {
        // 关闭弹窗并提示
        this.hideUserModal();
        wx.showToast({
          title: this.data.editingUser ? '编辑成功' : '添加成功',
          icon: 'success'
        });

        // 重新加载列表
        this.loadUserList(true);
      } else {
        wx.showToast({
          title: response.message || '操作失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('Save user error:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    }
  },
  
  // 删除用户
  deleteUser(e) {
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除该用户吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...'
          });

          try {
            const response = await api.deleteUser(id);
            wx.hideLoading();

            if (response.code === 200) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });

              // 重新加载列表
              this.loadUserList(true);
            } else {
              wx.showToast({
                title: response.message || '删除失败',
                icon: 'none'
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('Delete user error:', error);
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },
  
  // 显示用户详情
  showUserDetail(e) {
    const id = e.currentTarget.dataset.id;
    const user = this.data.userList.find(u => u.id === id);
    if (user) {
      this.setData({
        showDetailModal: true,
        currentUser: user
      });
    }
  },
  
  // 隐藏用户详情弹窗
  hideDetailModal() {
    this.setData({
      showDetailModal: false
    });
  },
  
  // 切换用户状态
  toggleUserStatus(e) {
    const id = e.currentTarget.dataset.id;
    const user = this.data.userList.find(u => u.id === id);
    if (user) {
      // 切换状态
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      
      // 更新用户列表
      const index = this.data.userList.findIndex(u => u.id === id);
      if (index !== -1) {
        const newList = [...this.data.userList];
        newList[index] = {
          ...user,
          status: newStatus
        };
        
        this.setData({
          userList: newList,
          currentUser: {
            ...this.data.currentUser,
            status: newStatus
          }
        });
        
        wx.showToast({
          title: newStatus === 'active' ? '已启用账号' : '已禁用账号',
          icon: 'success'
        });
      }
    }
  },
  
  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }
})
