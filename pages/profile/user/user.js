// user.js
Page({
  data: {
    searchKey: '', // 搜索关键词
    userList: [], // 用户列表
    campusList: [], // 校区列表
    roleOptions: ['管理员', '校长', '教练', '前台'], // 角色选项
    
    // 弹窗相关
    showUserModal: false, // 是否显示用户表单弹窗
    editingUser: null, // 当前正在编辑的用户
    userForm: { // 用户表单数据
      name: '',
      role: '',
      roleIndex: 0,
      phone: '',
      campus: '',
      campusIndex: 0,
      status: 'active',
      statusIndex: 0,
      password: '',
      remark: ''
    },
    showDetailModal: false, // 是否显示用户详情弹窗
    currentUser: {} // 当前查看详情的用户
  },
  
  onLoad() {
    this.loadCampusList();
    this.loadUserList();
  },
  
  // 搜索用户
  onSearch(e) {
    const searchKey = e.detail.value;
    this.setData({ searchKey });
    this.loadUserList();
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
  
  // 加载用户列表
  loadUserList() {
    // 模拟从服务器获取数据
    // 实际项目中应该调用API获取数据
    const mockUsers = [
      {
        id: 1,
        name: 'admin',
        role: '管理员',
        phone: '13800138000',
        campus: '总部校区',
        status: 'active',
        createTime: '2023-01-01 10:00:00',
        lastLogin: '2023-11-20 09:30:45',
        remark: '系统管理员账号'
      },
      {
        id: 2,
        name: 'zhangsan',
        role: '校长',
        phone: '13900139000',
        campus: '东区校区',
        status: 'active',
        createTime: '2023-02-15 14:30:00',
        lastLogin: '2023-11-19 16:45:12',
        remark: '东区校区负责人'
      },
      {
        id: 3,
        name: 'lisi',
        role: '教练',
        phone: '13700137000',
        campus: '南区校区',
        status: 'active',
        createTime: '2023-03-10 09:15:00',
        lastLogin: '2023-11-18 10:20:33',
        remark: '数学教练'
      },
      {
        id: 4,
        name: 'wangwu',
        role: '前台',
        phone: '13600136000',
        campus: '总部校区',
        status: 'inactive',
        createTime: '2023-04-05 11:20:00',
        lastLogin: '2023-10-25 14:15:27',
        remark: '前台接待人员'
      }
    ];
    
    // 根据搜索关键词过滤
    let filteredUsers = mockUsers;
    if (this.data.searchKey) {
      const key = this.data.searchKey.toLowerCase();
      filteredUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(key) || 
        user.role.toLowerCase().includes(key) ||
        user.phone.includes(key) ||
        user.campus.toLowerCase().includes(key)
      );
    }
    
    this.setData({
      userList: filteredUsers
    });
  },
  
  // 显示添加用户弹窗
  showAddUser() {
    this.setData({
      showUserModal: true,
      editingUser: null,
      userForm: {
        name: '',
        role: '',
        roleIndex: 0,
        phone: '',
        campus: '',
        campusIndex: 0,
        status: 'active',
        statusIndex: 0,
        password: '',
        remark: ''
      }
    });
  },
  
  // 显示编辑用户弹窗
  editUser(e) {
    const id = e.currentTarget.dataset.id;
    const user = this.data.userList.find(u => u.id === id);
    if (user) {
      // 找到对应的角色索引
      const roleIndex = this.data.roleOptions.findIndex(r => r === user.role);
      // 找到对应的校区索引
      const campusIndex = this.data.campusList.findIndex(c => c.name === user.campus);
      
      this.setData({
        showUserModal: true,
        editingUser: user,
        userForm: {
          name: user.name,
          role: user.role,
          roleIndex: roleIndex !== -1 ? roleIndex : 0,
          phone: user.phone,
          campus: user.campus,
          campusIndex: campusIndex !== -1 ? campusIndex : 0,
          status: user.status,
          statusIndex: user.status === 'active' ? 0 : 1,
          password: '', // 编辑时不显示密码
          remark: user.remark || ''
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
  
  // 保存用户
  saveUser() {
    const form = this.data.userForm;
    
    // 表单验证
    if (!form.name) {
      wx.showToast({
        title: '请输入用户名',
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
    
    if (!this.data.editingUser && !form.password) {
      wx.showToast({
        title: '请输入初始密码',
        icon: 'none'
      });
      return;
    }
    
    // 构造用户数据
    const userData = {
      name: form.name,
      role: form.role,
      phone: form.phone,
      campus: form.campus,
      status: form.status,
      remark: form.remark
    };
    
    // 编辑模式
    if (this.data.editingUser) {
      userData.id = this.data.editingUser.id;
      userData.createTime = this.data.editingUser.createTime;
      userData.lastLogin = this.data.editingUser.lastLogin;
      
      // 更新用户列表
      const index = this.data.userList.findIndex(u => u.id === userData.id);
      if (index !== -1) {
        const newList = [...this.data.userList];
        newList[index] = userData;
        this.setData({
          userList: newList
        });
      }
    } 
    // 添加模式
    else {
      userData.id = Date.now(); // 生成临时ID
      userData.createTime = this.formatDate(new Date()); // 当前时间作为创建时间
      userData.lastLogin = ''; // 新用户未登录过
      
      // 添加到用户列表
      this.setData({
        userList: [userData, ...this.data.userList]
      });
    }
    
    // 关闭弹窗并提示
    this.hideUserModal();
    wx.showToast({
      title: this.data.editingUser ? '编辑成功' : '添加成功',
      icon: 'success'
    });
  },
  
  // 删除用户
  deleteUser(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该用户吗？',
      success: res => {
        if (res.confirm) {
          // 从列表中删除
          const newList = this.data.userList.filter(u => u.id !== id);
          this.setData({
            userList: newList
          });
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
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