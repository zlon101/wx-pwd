import {gitlabManaget, IPsItem, randomString} from './tool';

interface IPageData {
  hasDecrypt: boolean;
  tabs: {label: string; value: string}[];
  curTab: string;
  tabContent: IPsItem[];
  inputVal: string;
  isEdit: boolean;
  textareaVal: string;
}

function filterPs(list: IPsItem[], s: string) {
  if (!s) return list;
  const reg = new RegExp(s, 'i');
  return list.filter((item: IPsItem) => reg.test(item));
}

const Sep = '\n\n\n';
const formatArray = {
  array2Str(arr: IPsItem[]) {
    return arr.join(Sep);
  },
  str2Array (str: string) {
    return str.trim().split(/\n{2,}/);
  },
};

Page<IPageData, any>({
  data: {
    hasDecrypt: false,
    inputVal: '',
    inputPlace: '请输入...',
    tabs: [],
    curTab: '',
    tabContent: [],
    // 编辑
    isEdit: false,
    specialChat: true,
    onlyNum: false,
    textareaVal: "",
    randomVal: '',
  },
  customData: {
    fileContentMap: new Map(),
  },
  onLoad() {
    const e: any = {};
    e.detail = {value: '1108 1109'};
    this.onInputConfirm(e);
  },
  async onTabClick(e: any) {
    const _path = typeof e === 'string' ? e : e.currentTarget.dataset.path;
    const cache = this.customData.fileContentMap.get(_path);
    let psArray;
    if (cache) {
      psArray = cache;
    } else {
      psArray = await gitlabManaget.getPsOfTab(_path);
      this.customData.fileContentMap.set(_path, psArray);
    }
    
    const _tabContent = (()=>{
      const _input = this.data.inputVal;
      if (this.data.hasDecrypt && _input) {
        return filterPs(psArray, _input);
      }
      return psArray;
    })();
    const nData:any = {
      tabContent: _tabContent,
      curTab: _path,
    };
    if (this.data.isEdit) {
      nData.textareaVal = formatArray.array2Str(psArray);
    }
    this.setData(nData);
  },
  onInputChange(e: any) {
    const val = e.detail.value;
    const newData: Partial<IPageData> = {
      inputVal: val,
    };
    if (this.data.hasDecrypt) {
      newData.tabContent = filterPs(this.customData.fileContentMap.get(this.data.curTab), val);
    }
    this.setData(newData);
  },
  // 开始、结束编辑
  onStartEdit() {
    if (!this.data.hasDecrypt) return;
    
    const nowPath = this.data.curTab;
    const psArr1 = this.customData.fileContentMap.get(nowPath);
    // 开始编辑
    if (!this.data.isEdit) {
      // const text = formatArray.array2Str(psArr1);
      // const newArr = formatArray.str2Array(text);
      // log('相等', JSON.stringify(psArr1) === JSON.stringify(newArr));
      this.setData({
        isEdit: true,
        textareaVal: formatArray.array2Str(psArr1),
        inputPlace: '字符长度',
        inputVal: 12,
      });
      return;
    }
    // 结束编辑
    const newArr = formatArray.str2Array(this.data.textareaVal);
    const newTxt = newArr.join(Sep);
    const nData: any = {
      isEdit: false,
      textareaVal: '',
      inputPlace: '搜索',
      inputVal: '',
    };
    if (newTxt !== psArr1.join(Sep)) {
      gitlabManaget.updateContent(nowPath, newTxt).then(() => {
        this.customData.fileContentMap.set(nowPath, newArr);
        this.setData(nData, () => this.onTabClick(nowPath));
      });
    } else {
      this.setData(nData);
    }
  },
  onEditCancel() {
    this.setData({
      isEdit: false,
      textareaVal: '',
    });
  },
  // 提交输入的密码
  onInputConfirm(e: any) {
    const _inputVal = e.detail.value.trim();
    if (!/\s+/.test(_inputVal)) return;

    const [a, b] = _inputVal.split(/\s+/);
    gitlabManaget.setToken(a);
    gitlabManaget.setContentPs(b);
    gitlabManaget.getFiles().then(files => {
      const _tabs = files.map(item => ({label: item.name, value: item.path}));
      this.onTabClick(_tabs[0].value);
      this.setData({
        tabs: _tabs,
        curTab: _tabs[0].value,
        hasDecrypt: true,
        inputVal: '',
        inputPlace: '搜索',
      });
    });
  },
  // 是否选中特殊字符
  onSwitchSpecialChat() {
    this.setData({specialChat: !this.data.specialChat});
  },
  onSwitchOnlyNum() {
    this.setData({onlyNum: !this.data.onlyNum});
  },
  // 生成随机数
  onRandom() {
    const _d = this.data;
    const l = parseInt(_d.inputVal);
    if (Number.isNaN(l)) return;
    const cfg = {onlyNumber: _d.onlyNum, speical: _d.specialChat};
    const res = randomString(l, cfg);
    this.setData({randomVal: res});
    // wx.setClipboardData({ data: res });
  },
})