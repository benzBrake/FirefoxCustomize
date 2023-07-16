# KeyChanger

A powerful custom keyboard shortcut script for Firefox.

The default configuration file is `profiledir\chrome\_keychanger.js`, and you can specify the configuration file path by modifying `keyChanger.FILE_PATH`.

## Download and Installation

[Click here](https://chat.openai.com/KeyChanger.uc.js) to download the script and save it in `profiledir\chrome` folder. Then, [click here](https://chat.openai.com/_keychanger.js) to download the example configuration file.

`KeyChanger_fx70.uc.js` is the JSActor version, which will be used for future implementation of visual configuration (currently not implemented due to lack of time).

## Configuration Format

### General Configuration Format

```
js
keys['CTRL+ALT+P'] = function() {
	// Your function
}
```

`CTRL+ALT+P` represents the key combination you want to use, and you should fill in your function code at the `// Your function` section.

### New Configuration Format

In `KeyChanger_fx70.uc.js`, in addition to the original configuration format, you can also use the built-in command format.

```
csharp
keys['F4'] = {
    oncommand: "internal",
    params: [
        'tab',
        'duplicate'
    ]
}; // Duplicate the current tab
```

Currently, the built-in commands are continuously being updated, and they will be documented here in the future.

### Example Configuration

[_keychanger.js](https://chat.openai.com/_keychanger.js) translates the configuration into English for me.