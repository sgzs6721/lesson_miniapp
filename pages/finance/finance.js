const api = require('../../utils/api.js');
const auth = require('../../utils/auth.js');
const campusCache = require('../../utils/campus-cache.js');

Page({
  data: {
    activeTab: 'payment', // 当前激活的标签页：payment 或 finance

    // 缴费记录相关
    paymentSearchKey: '', // 搜索关键词
    paymentMonth: '', // 当前选择的月份
    paymentTypeOptions: ['全部', '学费', '教材费', '报名费', '其他'],
    paymentTypeIndex: 0, // 当前选择的缴费类型索引
    paymentList: [], // 缴费记录列表
    showPaymentDetailModal: false, // 是否显示缴费详情弹窗
    currentPayment: {}, // 当前查看详情的缴费记录

    // 分页相关
    paymentPageNum: 1,
    paymentPageSize: 10,
    paymentTotal: 0,
    paymentHasMore: true,
    paymentLoading: false,

    // 统计数据
    paymentStats: {
      paymentCount: 0,
      paymentTotal: 0,
      refundCount: 0,
      refundTotal: 0
    },

    // 当前校区
    currentCampusId: null,

    // 滚动视图高度
    scrollViewHeight: 400,
    
    // 收支管理相关
    financeSearchKey: '', // 搜索关键词
    financeMonth: '', // 当前选择的月份
    financeTypeIndex: 0, // 当前选择的收支类型索引：0-全部，1-收入，2-支出
    financeList: [], // 收支记录列表
    monthlyIncome: 0, // 本月收入
    monthlyExpense: 0, // 本月支出
    monthlyBalance: 0, // 本月结余
    showFinanceModal: false, // 是否显示收支表单弹窗
    showFinanceDetailModal: false, // 是否显示收支详情弹窗
    editingFinance: null, // 当前正在编辑的收支记录
    currentFinance: {}, // 当前查看详情的收支记录
    financeForm: { // 收支表单数据
      typeIndex: 0, // 0-收入，1-支出
      project: '',
      amount: '',
      category: '',
      date: '',
      remark: ''
    }
  },
  
  async onLoad() {
    // 检查登录状态
    if (!auth.checkLoginAndRedirect()) {
      return;
    }

    await this.initData();
  },

  onShow() {
    // 更新TabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3 // 财务页是第四个标签，索引为3
      });
    }

    // 只有在已经有数据的情况下才刷新（避免重复加载）
    if (this.data.paymentList.length > 0) {
      this.loadPaymentList(true); // 刷新数据
    }
    if (this.data.activeTab === 'finance' && this.data.financeList.length > 0) {
      this.loadFinanceList();
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    if (this.data.activeTab === 'payment') {
      this.loadPaymentList(true);
    } else {
      this.loadFinanceList();
    }
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.activeTab === 'payment' && this.data.paymentHasMore && !this.data.paymentLoading) {
      this.loadPaymentList();
    }
  },
  
  // 初始化数据
  async initData() {
    // 设置当前月份
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStr = `${year}-${month < 10 ? '0' + month : month}`;

    this.setData({
      paymentMonth: monthStr,
      financeMonth: monthStr
    });

    // 获取系统信息，计算scroll-view高度
    const systemInfo = wx.getSystemInfoSync();
    const windowHeight = systemInfo.windowHeight;
    const tabBarHeight = 48; // 底部tab bar高度
    const tabsHeight = 48; // 标签页高度
    const statsHeight = 100; // 统计区域高度
    const searchHeight = 80; // 搜索区域高度
    const safeAreaBottom = 20; // 安全区域

    const scrollViewHeight = windowHeight - tabBarHeight - tabsHeight - statsHeight - searchHeight - safeAreaBottom;

    this.setData({
      scrollViewHeight: scrollViewHeight
    });

    // 获取当前校区
    const currentCampus = campusCache.getCurrentCampus();
    if (currentCampus) {
      this.setData({
        currentCampusId: currentCampus.id
      });

      // 加载缴费记录列表和统计
      this.loadPaymentList();
      this.loadPaymentStats();
    } else {
      wx.showToast({
        title: '请先选择校区',
        icon: 'none'
      });
    }
  },
  
  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    
    // 切换到收支管理标签页时，加载收支记录
    if (tab === 'finance' && this.data.financeList.length === 0) {
      this.loadFinanceList();
    }
  },
  
  // 搜索缴费记录
  onPaymentSearch(e) {
    const searchKey = e.detail.value;
    this.setData({
      paymentSearchKey: searchKey,
      paymentPageNum: 1,
      paymentList: [],
      paymentHasMore: true
    });
    this.loadPaymentList(true);
  },
  
  // 缴费月份选择变化
  onPaymentMonthChange(e) {
    this.setData({
      paymentMonth: e.detail.value,
      paymentPageNum: 1,
      paymentList: [],
      paymentHasMore: true
    });
    this.loadPaymentList(true);
  },

  // 缴费类型选择变化
  onPaymentTypeChange(e) {
    this.setData({
      paymentTypeIndex: e.detail.value,
      paymentPageNum: 1,
      paymentList: [],
      paymentHasMore: true
    });
    this.loadPaymentList(true);
  },
  
  // 加载缴费记录列表
  async loadPaymentList(refresh = false) {
    if (!this.data.currentCampusId) {
      console.log('No campus selected, skipping payment list load');
      return;
    }

    if (refresh) {
      this.setData({
        paymentPageNum: 1,
        paymentList: [],
        paymentHasMore: true
      });
    }

    this.setData({ paymentLoading: true });

    try {
      const response = await api.getPaymentRecordList(
        this.data.paymentPageNum,
        this.data.paymentPageSize,
        this.data.currentCampusId
      );
      console.log('Payment record list response:', response);

      if (response.code === 200) {
        const { data } = response;
        const newList = refresh ? data.list : [...this.data.paymentList, ...data.list];

        // 处理支付方式映射
        const processedList = newList.map(item => ({
          ...item,
          payTypeText: this.getPayTypeText(item.payType),
          paymentTypeText: this.getPaymentTypeText(item.paymentType),
          lessonChange: this.getLessonChangeText(item.lessonChange)
        }));

        const hasMore = data.list.length === this.data.paymentPageSize && newList.length < data.total;

        this.setData({
          paymentList: processedList,
          paymentTotal: data.total,
          paymentPageNum: this.data.paymentPageNum + 1,
          paymentHasMore: hasMore
        });
      } else {
        wx.showToast({
          title: response.message || '获取缴费记录失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('Load payment list error:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ paymentLoading: false });
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }
  },

  // 加载缴费统计
  async loadPaymentStats() {
    if (!this.data.currentCampusId) {
      return;
    }

    try {
      const response = await api.getPaymentRecordStat(this.data.currentCampusId);
      console.log('Payment stats response:', response);

      if (response.code === 200) {
        this.setData({
          paymentStats: response.data
        });
      }
    } catch (error) {
      console.error('Load payment stats error:', error);
    }
  },

  // 获取支付方式文本
  getPayTypeText(payType) {
    const payTypeMap = {
      'WECHAT': '微信支付',
      'ALIPAY': '支付宝',
      'CASH': '现金',
      'CARD': '刷卡',
      'TRANSFER': '转账'
    };
    return payTypeMap[payType] || payType;
  },

  // 获取缴费类型文本
  getPaymentTypeText(paymentType) {
    const paymentTypeMap = {
      'NEW': '新缴费',
      'RENEWAL': '续费',
      'REFUND': '退费'
    };
    return paymentTypeMap[paymentType] || paymentType;
  },

  // 获取课时变化文本
  getLessonChangeText(lessonChange) {
    if (!lessonChange) return null;

    // lessonChange 可能是数字或字符串
    const change = Number(lessonChange);
    if (isNaN(change) || change === 0) return null;

    if (change > 0) {
      return `+${change}课时`;
    } else {
      return `${change}课时`;
    }
  },
  
  // 显示缴费详情
  showPaymentDetail(e) {
    const id = e.currentTarget.dataset.id;
    const payment = this.data.paymentList.find(p => p.id === id);
    if (payment) {
      this.setData({
        showPaymentDetailModal: true,
        currentPayment: payment
      });
    }
  },
  
  // 隐藏缴费详情弹窗
  hidePaymentDetailModal() {
    this.setData({
      showPaymentDetailModal: false
    });
  },
  
  // 搜索收支记录
  onFinanceSearch(e) {
    const financeSearchKey = e.detail.value;
    this.setData({ financeSearchKey });
    this.loadFinanceList();
  },
  
  // 收支月份选择变化
  onFinanceMonthChange(e) {
    this.setData({
      financeMonth: e.detail.value
    });
    this.loadFinanceList();
  },
  
  // 收支类型选择变化
  onFinanceTypeChange(e) {
    this.setData({
      financeTypeIndex: e.detail.value
    });
    this.loadFinanceList();
  },
  
  // 加载收支记录列表
  loadFinanceList() {
    // 模拟从服务器获取数据
    // 实际项目中应该调用API获取数据
    const mockFinances = [
      {
        id: 1,
        type: 'income',
        project: '学费收入',
        amount: 5000,
        category: '课程收入',
        date: '2023-11-01',
        remark: '张小明、李小红学费'
      },
      {
        id: 2,
        type: 'expense',
        project: '教师工资',
        amount: 3000,
        category: '人力成本',
        date: '2023-11-05',
        remark: '王老师、李老师11月工资'
      },
      {
        id: 3,
        type: 'expense',
        project: '教材采购',
        amount: 1000,
        category: '教学物资',
        date: '2023-11-10',
        remark: '编程教材10本'
      },
      {
        id: 4,
        type: 'income',
        project: '教材费收入',
        amount: 500,
        category: '教材收入',
        date: '2023-11-03',
        remark: '王小刚教材费'
      },
      {
        id: 5,
        type: 'expense',
        project: '水电费',
        amount: 800,
        category: '场地费用',
        date: '2023-11-15',
        remark: '11月水电费'
      }
    ];
    
    // 根据筛选条件过滤
    let filteredFinances = mockFinances;
    
    // 按月份筛选
    if (this.data.financeMonth) {
      const monthPrefix = this.data.financeMonth;
      filteredFinances = filteredFinances.filter(item => 
        item.date.startsWith(monthPrefix)
      );
    }
    
    // 按收支类型筛选
    if (this.data.financeTypeIndex > 0) {
      const type = this.data.financeTypeIndex === 1 ? 'income' : 'expense';
      filteredFinances = filteredFinances.filter(item => 
        item.type === type
      );
    }
    
    // 按搜索关键词筛选
    if (this.data.financeSearchKey) {
      const key = this.data.financeSearchKey.toLowerCase();
      filteredFinances = filteredFinances.filter(item => 
        item.project.toLowerCase().includes(key) || 
        item.category.toLowerCase().includes(key) ||
        (item.remark && item.remark.toLowerCase().includes(key))
      );
    }
    
    // 计算本月收支统计
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    
    filteredFinances.forEach(item => {
      if (item.type === 'income') {
        monthlyIncome += Number(item.amount);
      } else {
        monthlyExpense += Number(item.amount);
      }
    });
    
    this.setData({
      financeList: filteredFinances,
      monthlyIncome: monthlyIncome.toFixed(2),
      monthlyExpense: monthlyExpense.toFixed(2),
      monthlyBalance: (monthlyIncome - monthlyExpense).toFixed(2)
    });
  },
  
  // 显示添加收支弹窗
  showAddFinance() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const today = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    
    this.setData({
      showFinanceModal: true,
      editingFinance: null,
      financeForm: {
        typeIndex: 0,
        project: '',
        amount: '',
        category: '',
        date: today,
        remark: ''
      }
    });
  },
  
  // 显示编辑收支弹窗
  editFinance(e) {
    const id = e.currentTarget.dataset.id;
    const finance = this.data.financeList.find(f => f.id === id);
    if (finance) {
      this.setData({
        showFinanceModal: true,
        editingFinance: finance,
        financeForm: {
          typeIndex: finance.type === 'income' ? 0 : 1,
          project: finance.project,
          amount: finance.amount.toString(),
          category: finance.category,
          date: finance.date,
          remark: finance.remark || ''
        }
      });
    }
  },
  
  // 隐藏收支表单弹窗
  hideFinanceModal() {
    this.setData({
      showFinanceModal: false
    });
  },
  
  // 收支表单类型变化
  onFinanceFormTypeChange(e) {
    this.setData({
      'financeForm.typeIndex': e.detail.value
    });
  },
  
  // 收支表单日期变化
  onFinanceFormDateChange(e) {
    this.setData({
      'financeForm.date': e.detail.value
    });
  },
  
  // 收支表单输入变化
  onFinanceFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`financeForm.${field}`]: value
    });
  },
  
  // 保存收支记录
  saveFinance() {
    const form = this.data.financeForm;
    
    // 表单验证
    if (!form.project) {
      wx.showToast({
        title: '请输入项目名称',
        icon: 'none'
      });
      return;
    }
    
    if (!form.amount) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      });
      return;
    }
    
    if (!form.category) {
      wx.showToast({
        title: '请输入收支类型',
        icon: 'none'
      });
      return;
    }
    
    if (!form.date) {
      wx.showToast({
        title: '请选择日期',
        icon: 'none'
      });
      return;
    }
    
    // 构造收支数据
    const financeData = {
      type: form.typeIndex == 0 ? 'income' : 'expense',
      project: form.project,
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date,
      remark: form.remark
    };
    
    // 编辑模式
    if (this.data.editingFinance) {
      financeData.id = this.data.editingFinance.id;
      
      // 更新收支列表
      const index = this.data.financeList.findIndex(f => f.id === financeData.id);
      if (index !== -1) {
        const newList = [...this.data.financeList];
        newList[index] = financeData;
        this.setData({
          financeList: newList
        });
      }
    } 
    // 添加模式
    else {
      financeData.id = Date.now(); // 生成临时ID
      
      // 添加到收支列表
      this.setData({
        financeList: [financeData, ...this.data.financeList]
      });
    }
    
    // 重新计算收支统计
    this.updateFinanceSummary();
    
    // 关闭弹窗并提示
    this.hideFinanceModal();
    wx.showToast({
      title: this.data.editingFinance ? '编辑成功' : '添加成功',
      icon: 'success'
    });
  },
  
  // 删除收支记录
  deleteFinance(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该收支记录吗？',
      success: res => {
        if (res.confirm) {
          // 从列表中删除
          const newList = this.data.financeList.filter(f => f.id !== id);
          this.setData({
            financeList: newList
          });
          
          // 重新计算收支统计
          this.updateFinanceSummary();
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },
  
  // 更新收支统计
  updateFinanceSummary() {
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    
    this.data.financeList.forEach(item => {
      if (item.type === 'income') {
        monthlyIncome += Number(item.amount);
      } else {
        monthlyExpense += Number(item.amount);
      }
    });
    
    this.setData({
      monthlyIncome: monthlyIncome.toFixed(2),
      monthlyExpense: monthlyExpense.toFixed(2),
      monthlyBalance: (monthlyIncome - monthlyExpense).toFixed(2)
    });
  },
  
  // 显示收支详情
  showFinanceDetail(e) {
    const id = e.currentTarget.dataset.id;
    const finance = this.data.financeList.find(f => f.id === id);
    if (finance) {
      this.setData({
        showFinanceDetailModal: true,
        currentFinance: finance
      });
    }
  },
  
  // 隐藏收支详情弹窗
  hideFinanceDetailModal() {
    this.setData({
      showFinanceDetailModal: false
    });
  }
}) 
