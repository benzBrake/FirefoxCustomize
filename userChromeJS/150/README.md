# 适用于 Firefox 150 + 以及更高版本的脚本

如果你的脚本在 Firefox 150 版本失效，下面可能帮到你

## 1. Cu.Sandbox() freezeBuiltins 默认行为变化

Firefox 150 中，`Cu.Sandbox()` 的默认行为发生变化，沙箱中的内置对象（built-in objects）默认被冻结。

**问题表现：**
- 在沙箱中修改 `Function.prototype` 等内置对象时抛出错误
- 脚本中 `toSource()` 等扩展功能失效
- 错误信息可能包含 "cannot assign to read only property" 或类似提示

**解决方案：**

把

```javascript
sb = Cu.Sandbox(window, {
    sandboxPrototype: window,
    sameZoneAs: window,
});
```

替换为

```javascript
sb = Cu.Sandbox(window, {
    sandboxPrototype: window,
    sameZoneAs: window,
    freezeBuiltins: false,  // 允许修改内置对象
});
```

**完整示例：**

```javascript
// 创建沙箱并扩展 Function.prototype
let sb = Cu.Sandbox(window, {
    sandboxPrototype: window,
    sameZoneAs: window,
    freezeBuiltins: false,  // Firefox 150+ 必须添加此选项
});

Cu.evalInSandbox(`
    // 恢复 toSource() 方法
    Function.prototype.toSource = window.Function.prototype.toSource;
`, sb);

// 现在可以在沙箱中使用 toSource()
let result = Cu.evalInSandbox(`
    (function() { return 42; }).toSource();
`, sb);
```

**兼容多个版本的示例：**

```javascript
let sbOptions = {
    sandboxPrototype: window,
    sameZoneAs: window,
};

// Firefox 150+ 需要设置 freezeBuiltins: false
let sb = Cu.Sandbox(window, sbOptions);
if (!sb.Object.isFrozen(Array.prototype)) {
    // 如果内置对象未被冻结，说明需要重新创建沙箱
    sb = Cu.Sandbox(window, {
        ...sbOptions,
        freezeBuiltins: false,
    });
}
```

**注意事项：**
- Firefox 150 中，`Cu.Sandbox()` 默认冻结内置对象以提高安全性
- 如果脚本需要在沙箱中修改 `Function.prototype`、`Array.prototype` 等内置对象，必须显式设置 `freezeBuiltins: false`
- 这个选项影响的是沙箱内的内置对象副本，不会影响外层窗口的内置对象
- 安全提示：只有在确实需要修改内置对象时才设置 `freezeBuiltins: false`，否则保持默认的冻结状态更安全

**相关 Bug：**
- [Bug 2017957](https://bugzilla.mozilla.org/show_bug.cgi?id=2017957) - Add freezeBuiltins: false to Cu.Sandbox options
