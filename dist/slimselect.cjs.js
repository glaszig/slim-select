'use strict';

function generateID() {
    return Math.random().toString(36).substring(2, 10);
}
function hasClassInTree(element, className) {
    function hasClass(e, c) {
        if (c && e && e.classList && e.classList.contains(c)) {
            return e;
        }
        if (c && e && e.dataset && e.dataset.id && e.dataset.id === className) {
            return e;
        }
        return null;
    }
    function parentByClass(e, c) {
        if (!e || e === document) {
            return null;
        }
        else if (hasClass(e, c)) {
            return e;
        }
        else {
            return parentByClass(e.parentNode, c);
        }
    }
    return hasClass(element, className) || parentByClass(element, className);
}
function debounce(func, wait = 50, immediate = false) {
    let timeout;
    return function (...args) {
        const context = self;
        const later = () => {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            func.apply(context, args);
        }
    };
}
function kebabCase(str) {
    const result = str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match) => '-' + match.toLowerCase());
    return str[0] === str[0].toUpperCase() ? result.substring(1) : result;
}

class Optgroup {
    constructor(optgroup) {
        this.id = !optgroup.id || optgroup.id === '' ? generateID() : optgroup.id;
        this.label = optgroup.label || '';
        this.options = [];
        if (optgroup.options) {
            for (const o of optgroup.options) {
                this.options.push(new Option(o));
            }
        }
    }
}
class Option {
    constructor(option) {
        this.id = !option.id || option.id === '' ? generateID() : option.id;
        this.value = option.value === undefined ? option.text : option.value;
        this.text = option.text || '';
        this.html = option.html || '';
        this.selected = option.selected !== undefined ? option.selected : false;
        this.display = option.display !== undefined ? option.display : true;
        this.disabled = option.disabled !== undefined ? option.disabled : false;
        this.mandatory = option.mandatory !== undefined ? option.mandatory : false;
        this.placeholder = option.placeholder !== undefined ? option.placeholder : false;
        this.class = option.class || '';
        this.style = option.style || '';
        this.data = option.data || {};
    }
}
class Store {
    constructor(type, data) {
        this.selectType = 'single';
        this.data = [];
        this.selectType = type;
        this.setData(data);
    }
    validateDataArray(data) {
        if (!Array.isArray(data)) {
            return new Error('Data must be an array');
        }
        for (let dataObj of data) {
            if (dataObj instanceof Optgroup || 'label' in dataObj) {
                if (!('label' in dataObj)) {
                    return new Error('Optgroup must have a label');
                }
                if ('options' in dataObj && dataObj.options) {
                    for (let option of dataObj.options) {
                        return this.validateOption(option);
                    }
                }
            }
            else if (dataObj instanceof Option || 'text' in dataObj) {
                return this.validateOption(dataObj);
            }
            else {
                return new Error('Data object must be a valid optgroup or option');
            }
        }
        return null;
    }
    validateOption(option) {
        if (!('text' in option)) {
            return new Error('Option must have a text');
        }
        return null;
    }
    partialToFullData(data) {
        let dataFinal = [];
        data.forEach((dataObj) => {
            if (dataObj instanceof Optgroup || 'label' in dataObj) {
                let optOptions = [];
                if ('options' in dataObj && dataObj.options) {
                    dataObj.options.forEach((option) => {
                        optOptions.push(new Option(option));
                    });
                }
                if (optOptions.length > 0) {
                    dataFinal.push(new Optgroup(dataObj));
                }
            }
            if (dataObj instanceof Option || 'text' in dataObj) {
                dataFinal.push(new Option(dataObj));
            }
        });
        return dataFinal;
    }
    setData(data) {
        this.data = this.partialToFullData(data);
        if (this.selectType === 'single') {
            this.setSelectedBy('value', this.getSelected());
        }
    }
    getData() {
        return this.filter(null, true);
    }
    getDataOptions() {
        return this.filter(null, false);
    }
    addOption(option) {
        this.setData(this.getData().concat(new Option(option)));
    }
    setSelectedBy(selectedType, selectedValues) {
        let firstOption = null;
        let hasSelected = false;
        for (let dataObj of this.data) {
            if (dataObj instanceof Optgroup) {
                for (let option of dataObj.options) {
                    if (!firstOption) {
                        firstOption = option;
                    }
                    option.selected = hasSelected ? false : selectedValues.includes(option[selectedType]);
                    if (option.selected && this.selectType === 'single') {
                        hasSelected = true;
                    }
                }
            }
            if (dataObj instanceof Option) {
                if (!firstOption) {
                    firstOption = dataObj;
                }
                dataObj.selected = hasSelected ? false : selectedValues.includes(dataObj[selectedType]);
                if (dataObj.selected && this.selectType === 'single') {
                    hasSelected = true;
                }
            }
        }
        if (this.selectType === 'single' && firstOption && !hasSelected) {
            firstOption.selected = true;
        }
    }
    getSelected() {
        let selectedOptions = this.getSelectedOptions();
        let selectedValues = [];
        selectedOptions.forEach((option) => {
            selectedValues.push(option.value);
        });
        return selectedValues;
    }
    getSelectedOptions() {
        return this.filter((opt) => {
            return opt.selected;
        }, false);
    }
    getSelectedIDs() {
        let selectedOptions = this.getSelectedOptions();
        let selectedIDs = [];
        selectedOptions.forEach((op) => {
            selectedIDs.push(op.id);
        });
        return selectedIDs;
    }
    getOptionByID(id) {
        let options = this.filter((opt) => {
            return opt.id === id;
        }, false);
        return options.length ? options[0] : null;
    }
    search(search, searchFilter) {
        search = search.trim();
        if (search === '') {
            return this.getData();
        }
        return this.filter((opt) => {
            return searchFilter(opt, search);
        }, true);
    }
    filter(filter, includeOptgroup) {
        const dataSearch = [];
        this.data.forEach((dataObj) => {
            if (dataObj instanceof Optgroup) {
                if (!includeOptgroup) {
                    dataObj.options.forEach((option) => {
                        if (filter && filter(option)) {
                            dataSearch.push(option);
                        }
                    });
                }
                else {
                    let optOptions = [];
                    dataObj.options.forEach((option) => {
                        if (!filter || filter(option)) {
                            optOptions.push(new Option(option));
                        }
                    });
                    if (optOptions.length > 0) {
                        dataSearch.push(new Optgroup({ id: dataObj.id, label: dataObj.label, options: optOptions }));
                    }
                }
            }
            if (dataObj instanceof Option) {
                if (!filter || filter(dataObj)) {
                    dataSearch.push(new Option(dataObj));
                }
            }
        });
        return dataSearch;
    }
}

class Render {
    constructor(settings, store, callbacks) {
        this.classes = {
            main: 'ss-main',
            placeholder: 'ss-placeholder',
            values: 'ss-values',
            single: 'ss-single',
            value: 'ss-value',
            valueText: 'ss-value-text',
            valueDelete: 'ss-value-delete',
            valueOut: 'ss-value-out',
            deselect: 'ss-deselect',
            deselectPath: 'M10,10 L90,90 M10,90 L90,10',
            arrow: 'ss-arrow',
            arrowClose: 'M10,30 L50,70 L90,30',
            arrowOpen: 'M10,70 L50,30 L90,70',
            content: 'ss-content',
            openAbove: 'ss-open-above',
            openBelow: 'ss-open-below',
            search: 'ss-search',
            searchHighlighter: 'ss-search-highlight',
            searching: 'ss-searching',
            addable: 'ss-addable',
            addablePath: 'M50,10 L50,90 M10,50 L90,50',
            list: 'ss-list',
            optgroup: 'ss-optgroup',
            optgroupLabel: 'ss-optgroup-label',
            optgroupSelectable: 'ss-optgroup-selectable',
            option: 'ss-option',
            optionSelected: 'ss-option-selected',
            optionDelete: 'M10,10 L90,90 M10,90 L90,10',
            highlighted: 'ss-highlighted',
            error: 'ss-error',
            disabled: 'ss-disabled',
            hide: 'ss-hide',
        };
        this.store = store;
        this.settings = settings;
        this.callbacks = callbacks;
        this.main = this.mainDiv();
        this.content = this.contentDiv();
        this.renderValues();
        this.renderOptions(this.store.getData());
        this.settings.contentLocation.appendChild(this.content.main);
    }
    enable() {
        this.main.main.classList.remove(this.classes.disabled);
        this.content.search.input.disabled = false;
    }
    disable() {
        this.main.main.classList.add(this.classes.disabled);
        this.content.search.input.disabled = true;
    }
    open() {
        this.main.arrow.path.setAttribute('d', this.classes.arrowOpen);
        this.main.main.classList.add(this.settings.openPosition === 'up' ? this.classes.openAbove : this.classes.openBelow);
        this.moveContent();
        this.renderOptions(this.store.getData());
        if (this.settings.contentPosition === 'relative') {
            this.moveContentBelow();
        }
        else if (this.settings.openPosition.toLowerCase() === 'up') {
            this.moveContentAbove();
        }
        else if (this.settings.openPosition.toLowerCase() === 'down') {
            this.moveContentBelow();
        }
        else {
            if (this.putContent(this.content.main, this.settings.isOpen) === 'up') {
                this.moveContentAbove();
            }
            else {
                this.moveContentBelow();
            }
        }
        const selectedOptions = this.store.getSelectedOptions();
        if (selectedOptions.length) {
            const selectedId = selectedOptions[selectedOptions.length - 1].id;
            const selectedOption = this.content.list.querySelector('[data-id="' + selectedId + '"]');
            if (selectedOption) {
                this.ensureElementInView(this.content.list, selectedOption);
            }
        }
    }
    close() {
        this.main.main.classList.remove(this.classes.openAbove);
        this.main.main.classList.remove(this.classes.openBelow);
        this.content.main.classList.remove(this.classes.openAbove);
        this.content.main.classList.remove(this.classes.openBelow);
        this.main.arrow.path.setAttribute('d', this.classes.arrowClose);
    }
    mainDiv() {
        const main = document.createElement('div');
        main.tabIndex = 0;
        main.style.cssText = this.settings.style !== '' ? this.settings.style : '';
        main.className = '';
        main.classList.add(this.settings.id);
        main.classList.add(this.classes.main);
        if (this.settings.class) {
            for (const c of this.settings.class) {
                if (c.trim() !== '') {
                    main.classList.add(c.trim());
                }
            }
        }
        main.onfocus = () => {
            if (this.settings.triggerFocus) {
                this.callbacks.open();
            }
        };
        main.onkeydown = (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                    this.callbacks.open();
                    e.key === 'ArrowDown' ? this.highlight('down') : this.highlight('up');
                    return false;
                case 'Tab':
                    this.callbacks.close();
                    return true;
                case 'Enter':
                    const highlighted = this.content.list.querySelector('.' + this.classes.highlighted);
                    if (highlighted) {
                        highlighted.click();
                    }
                    return false;
                case 'Escape':
                    this.callbacks.close();
                    return false;
            }
        };
        main.onclick = (e) => {
            if (!this.settings.isEnabled) {
                return;
            }
            this.settings.isOpen ? this.callbacks.close() : this.callbacks.open();
        };
        const values = document.createElement('div');
        values.classList.add(this.classes.values);
        main.appendChild(values);
        const deselect = document.createElement('div');
        deselect.classList.add(this.classes.deselect);
        if (!this.settings.allowDeselect || this.settings.isMultiple) {
            deselect.classList.add(this.classes.hide);
        }
        deselect.onclick = (e) => {
            e.stopPropagation();
            if (!this.settings.isEnabled) {
                return;
            }
            let shouldDelete = true;
            const before = this.store.getSelectedOptions();
            const after = [];
            if (this.callbacks.beforeChange) {
                shouldDelete = this.callbacks.beforeChange(after, before) === true;
            }
            if (shouldDelete) {
                this.callbacks.setSelected(['']);
                if (this.settings.closeOnSelect) {
                    this.callbacks.close();
                }
                if (this.callbacks.afterChange) {
                    this.callbacks.afterChange(after);
                }
            }
        };
        const deselectSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        deselectSvg.setAttribute('viewBox', '0 0 100 100');
        const deselectPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        deselectPath.setAttribute('d', this.classes.deselectPath);
        deselectSvg.appendChild(deselectPath);
        deselect.appendChild(deselectSvg);
        main.appendChild(deselect);
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        arrow.classList.add(this.classes.arrow);
        arrow.setAttribute('viewBox', '0 0 100 100');
        const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowPath.setAttribute('d', this.classes.arrowClose);
        if (this.settings.alwaysOpen) {
            arrow.classList.add(this.classes.hide);
        }
        arrow.appendChild(arrowPath);
        main.appendChild(arrow);
        return {
            main: main,
            values: values,
            deselect: {
                main: deselect,
                svg: deselectSvg,
                path: deselectPath,
            },
            arrow: {
                main: arrow,
                path: arrowPath,
            },
        };
    }
    mainFocus(trigger) {
        if (!trigger) {
            this.settings.triggerFocus = false;
        }
        this.main.main.focus({ preventScroll: true });
        this.settings.triggerFocus = true;
    }
    placeholder() {
        const placeholderOption = this.store.filter((o) => o.placeholder, false);
        let placeholderText = this.settings.placeholderText;
        if (placeholderOption.length) {
            if (placeholderOption[0].html !== '') {
                placeholderText = placeholderOption[0].html;
            }
            else if (placeholderOption[0].text !== '') {
                placeholderText = placeholderOption[0].text;
            }
        }
        const placeholder = document.createElement('div');
        placeholder.classList.add(this.classes.placeholder);
        placeholder.innerHTML = placeholderText;
        return placeholder;
    }
    renderValues() {
        if (!this.settings.isMultiple) {
            this.renderSingleValue();
            return;
        }
        this.renderMultipleValues();
    }
    renderSingleValue() {
        const selected = this.store.filter((o) => {
            return o.selected && !o.placeholder;
        }, false);
        const selectedSingle = selected.length > 0 ? selected[0] : null;
        if (!selectedSingle) {
            this.main.values.innerHTML = this.placeholder().outerHTML;
        }
        else {
            const singleValue = document.createElement('div');
            singleValue.classList.add(this.classes.single);
            singleValue.innerHTML = selectedSingle.html ? selectedSingle.html : selectedSingle.text;
            this.main.values.innerHTML = singleValue.outerHTML;
        }
        if (!this.settings.allowDeselect || !selected.length) {
            this.main.deselect.main.classList.add(this.classes.hide);
        }
        else {
            this.main.deselect.main.classList.remove(this.classes.hide);
        }
    }
    renderMultipleValues() {
        let currentNodes = this.main.values.childNodes;
        let selectedOptions = this.store.filter((opt) => {
            return opt.selected && opt.display;
        }, false);
        if (selectedOptions.length === 0) {
            this.main.values.innerHTML = this.placeholder().outerHTML;
            return;
        }
        else {
            const placeholder = this.main.values.querySelector('.' + this.classes.placeholder);
            if (placeholder) {
                placeholder.remove();
            }
        }
        let removeNodes = [];
        for (let i = 0; i < currentNodes.length; i++) {
            const node = currentNodes[i];
            const id = node.getAttribute('data-id');
            if (id) {
                const found = selectedOptions.filter((opt) => {
                    return opt.id === id;
                }, false);
                if (!found.length) {
                    removeNodes.push(node);
                }
            }
        }
        for (const n of removeNodes) {
            n.classList.add(this.classes.valueOut);
            setTimeout(() => {
                this.main.values.removeChild(n);
            }, 100);
        }
        currentNodes = this.main.values.childNodes;
        for (let d = 0; d < selectedOptions.length; d++) {
            let shouldAdd = true;
            for (let i = 0; i < currentNodes.length; i++) {
                if (selectedOptions[d].id === String(currentNodes[i].dataset.id)) {
                    shouldAdd = false;
                }
            }
            if (shouldAdd) {
                if (currentNodes.length === 0) {
                    this.main.values.appendChild(this.multipleValue(selectedOptions[d]));
                }
                else if (d === 0) {
                    this.main.values.insertBefore(this.multipleValue(selectedOptions[d]), currentNodes[d]);
                }
                else {
                    currentNodes[d - 1].insertAdjacentElement('afterend', this.multipleValue(selectedOptions[d]));
                }
            }
        }
    }
    multipleValue(option) {
        const value = document.createElement('div');
        value.classList.add(this.classes.value);
        value.dataset.id = option.id;
        const text = document.createElement('div');
        text.classList.add(this.classes.valueText);
        text.innerHTML = option.text;
        value.appendChild(text);
        if (!option.mandatory) {
            const deleteDiv = document.createElement('div');
            deleteDiv.classList.add(this.classes.valueDelete);
            deleteDiv.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                let shouldDelete = true;
                const before = this.store.getSelectedOptions();
                const after = before.filter((o) => {
                    return o.selected && o.id !== option.id;
                }, true);
                if (this.settings.minSelected && after.length < this.settings.minSelected) {
                    return;
                }
                if (this.callbacks.beforeChange) {
                    shouldDelete = this.callbacks.beforeChange(after, before) === true;
                }
                if (shouldDelete) {
                    let selectedValues = [];
                    for (const o of after) {
                        if (o instanceof Optgroup) {
                            for (const c of o.options) {
                                selectedValues.push(c.value);
                            }
                        }
                        if (o instanceof Option) {
                            selectedValues.push(o.value);
                        }
                    }
                    this.callbacks.setSelected(selectedValues);
                    if (this.settings.closeOnSelect) {
                        this.callbacks.close();
                    }
                    if (this.callbacks.afterChange) {
                        this.callbacks.afterChange(after);
                    }
                }
            };
            const deleteSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            deleteSvg.setAttribute('viewBox', '0 0 100 100');
            const deletePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            deletePath.setAttribute('d', this.classes.optionDelete);
            deleteSvg.appendChild(deletePath);
            deleteDiv.appendChild(deleteSvg);
            value.appendChild(deleteDiv);
        }
        return value;
    }
    contentDiv() {
        const main = document.createElement('div');
        main.classList.add(this.classes.content);
        main.dataset.id = this.settings.id;
        if (this.settings.style !== '') {
            main.style.cssText = this.settings.style;
        }
        if (this.settings.contentPosition === 'relative') {
            main.classList.add('ss-' + this.settings.contentPosition);
        }
        if (this.settings.class.length) {
            for (const c of this.settings.class) {
                if (c.trim() !== '') {
                    main.classList.add(c.trim());
                }
            }
        }
        const search = this.searchDiv();
        main.appendChild(search.main);
        const list = this.listDiv();
        main.appendChild(list);
        return {
            main: main,
            search: search,
            list: list,
        };
    }
    moveContent() {
        if (this.settings.contentPosition === 'relative') {
            return;
        }
        const containerRect = this.main.main.getBoundingClientRect();
        this.content.main.style.top = containerRect.top + containerRect.height + window.scrollY + 'px';
        this.content.main.style.left = containerRect.left + window.scrollX + 'px';
        this.content.main.style.width = containerRect.width + 'px';
    }
    searchDiv() {
        const main = document.createElement('div');
        const input = document.createElement('input');
        const addable = document.createElement('div');
        main.classList.add(this.classes.search);
        const searchReturn = {
            main,
            input,
        };
        if (!this.settings.showSearch) {
            main.classList.add(this.classes.hide);
            input.readOnly = true;
        }
        input.type = 'search';
        input.placeholder = this.settings.searchPlaceholder;
        input.tabIndex = -1;
        input.setAttribute('aria-label', this.settings.searchPlaceholder);
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.oninput = debounce((e) => {
            this.callbacks.search(e.target.value);
        }, 100);
        input.onkeydown = (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                    this.callbacks.open();
                    e.key === 'ArrowDown' ? this.highlight('down') : this.highlight('up');
                    return false;
                case 'Tab':
                    this.callbacks.close();
                    return true;
                case 'Escape':
                    this.callbacks.close();
                    return false;
                case 'Enter':
                    if (this.callbacks.addable && e.ctrlKey) {
                        addable.click();
                    }
                    else {
                        const highlighted = this.content.list.querySelector('.' + this.classes.highlighted);
                        if (highlighted) {
                            highlighted.click();
                        }
                    }
                    return false;
            }
        };
        input.onfocus = () => {
            if (this.settings.isOpen) {
                return;
            }
            this.callbacks.open();
        };
        main.appendChild(input);
        if (this.callbacks.addable) {
            addable.classList.add(this.classes.addable);
            const plus = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            plus.setAttribute('viewBox', '0 0 100 100');
            const plusPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            plusPath.setAttribute('d', this.classes.addablePath);
            plus.appendChild(plusPath);
            addable.appendChild(plus);
            addable.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this.callbacks.addable) {
                    return;
                }
                const inputValue = this.content.search.input.value.trim();
                if (inputValue === '') {
                    this.content.search.input.focus();
                    return;
                }
                const runFinish = (oo) => {
                    let newOption = new Option(oo);
                    this.callbacks.addOption(newOption);
                    if (this.settings.isMultiple) {
                        let values = this.store.getSelected();
                        values.push(newOption.value);
                        this.callbacks.setSelected(values);
                    }
                    else {
                        this.callbacks.setSelected([newOption.value]);
                    }
                    this.callbacks.search('');
                    if (this.settings.closeOnSelect) {
                        setTimeout(() => {
                            this.callbacks.close();
                        }, 100);
                    }
                };
                const addableValue = this.callbacks.addable(inputValue);
                if (addableValue instanceof Promise) {
                    addableValue.then((value) => {
                        if (typeof value === 'string') {
                            runFinish({
                                text: value,
                                value: value,
                            });
                        }
                        else {
                            runFinish(value);
                        }
                    });
                }
                else if (typeof addableValue === 'string') {
                    runFinish({
                        text: addableValue,
                        value: addableValue,
                    });
                }
                else {
                    runFinish(addableValue);
                }
                return;
            };
            main.appendChild(addable);
            searchReturn.addable = {
                main: addable,
                svg: plus,
                path: plusPath,
            };
        }
        return searchReturn;
    }
    searchFocus(trigger) {
        if (!trigger) {
            this.settings.triggerFocus = false;
        }
        this.content.search.input.focus();
        this.settings.triggerFocus = true;
    }
    getOptions(notPlaceholder = false, notDisabled = false, notHidden = false) {
        let query = '.' + this.classes.option;
        if (notPlaceholder) {
            query += ':not(.' + this.classes.placeholder + ')';
        }
        if (notDisabled) {
            query += ':not(.' + this.classes.disabled + ')';
        }
        if (notHidden) {
            query += ':not(.' + this.classes.hide + ')';
        }
        return Array.from(this.content.list.querySelectorAll(query));
    }
    highlight(dir) {
        const options = this.getOptions(true, true, true);
        if (options.length === 0) {
            return;
        }
        if (options.length === 1) {
            if (!options[0].classList.contains(this.classes.highlighted)) {
                options[0].classList.add(this.classes.highlighted);
                return;
            }
        }
        for (let i = 0; i < options.length; i++) {
            if (options[i].classList.contains(this.classes.highlighted)) {
                options[i].classList.remove(this.classes.highlighted);
                if (dir === 'down') {
                    if (i + 1 < options.length) {
                        options[i + 1].classList.add(this.classes.highlighted);
                        this.ensureElementInView(this.content.list, options[i + 1]);
                    }
                    else {
                        options[0].classList.add(this.classes.highlighted);
                        this.ensureElementInView(this.content.list, options[0]);
                    }
                }
                else {
                    if (i - 1 >= 0) {
                        options[i - 1].classList.add(this.classes.highlighted);
                        this.ensureElementInView(this.content.list, options[i - 1]);
                    }
                    else {
                        options[options.length - 1].classList.add(this.classes.highlighted);
                        this.ensureElementInView(this.content.list, options[options.length - 1]);
                    }
                }
                return;
            }
        }
        options[dir === 'down' ? 0 : options.length - 1].classList.add(this.classes.highlighted);
        this.ensureElementInView(this.content.list, options[dir === 'down' ? 0 : options.length - 1]);
    }
    listDiv() {
        const options = document.createElement('div');
        options.classList.add(this.classes.list);
        options.setAttribute('role', 'listbox');
        return options;
    }
    renderError(error) {
        this.content.list.innerHTML = '';
        const errorDiv = document.createElement('div');
        errorDiv.classList.add(this.classes.error);
        errorDiv.textContent = error;
        this.content.list.appendChild(errorDiv);
    }
    renderSearching() {
        this.content.list.innerHTML = '';
        const searchingDiv = document.createElement('div');
        searchingDiv.classList.add(this.classes.searching);
        searchingDiv.textContent = this.settings.searchingText;
        this.content.list.appendChild(searchingDiv);
    }
    renderOptions(data) {
        this.content.list.innerHTML = '';
        if (data.length === 0) {
            const noResults = document.createElement('div');
            noResults.classList.add(this.classes.option);
            noResults.classList.add(this.classes.disabled);
            noResults.innerHTML = this.settings.searchText;
            this.content.list.appendChild(noResults);
            return;
        }
        for (const d of data) {
            if (d instanceof Optgroup) {
                const optgroupEl = document.createElement('div');
                optgroupEl.classList.add(this.classes.optgroup);
                const optgroupLabel = document.createElement('div');
                optgroupLabel.classList.add(this.classes.optgroupLabel);
                optgroupLabel.innerHTML = d.label;
                if (this.settings.selectByGroup && this.settings.isMultiple) {
                    optgroupLabel.classList.add(this.classes.optgroupSelectable);
                    optgroupLabel.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        for (const childEl of optgroupEl.children) {
                            if (childEl.className.indexOf(this.classes.option) !== -1) {
                                childEl.click();
                            }
                        }
                    });
                }
                optgroupEl.appendChild(optgroupLabel);
                for (const o of d.options) {
                    optgroupEl.appendChild(this.option(o));
                }
                this.content.list.appendChild(optgroupEl);
            }
            if (d instanceof Option) {
                this.content.list.appendChild(this.option(d));
            }
        }
    }
    option(option) {
        if (option.placeholder) {
            const placeholder = document.createElement('div');
            placeholder.classList.add(this.classes.option);
            placeholder.classList.add(this.classes.hide);
            return placeholder;
        }
        const optionEl = document.createElement('div');
        optionEl.dataset.id = option.id;
        optionEl.classList.add(this.classes.option);
        optionEl.setAttribute('role', 'option');
        if (option.class) {
            option.class.split(' ').forEach((dataClass) => {
                optionEl.classList.add(dataClass);
            });
        }
        if (option.style) {
            optionEl.style.cssText = option.style;
        }
        if (this.settings.searchHighlight && this.content.search.input.value.trim() !== '') {
            const textOrHtml = option.html !== '' ? option.html : option.text;
            optionEl.innerHTML = this.highlightText(textOrHtml, this.content.search.input.value, this.classes.searchHighlighter);
        }
        else if (option.html !== '') {
            optionEl.innerHTML = option.html;
        }
        else {
            optionEl.textContent = option.text;
        }
        if (this.settings.showOptionTooltips && optionEl.textContent) {
            optionEl.setAttribute('title', optionEl.textContent);
        }
        if ((option.selected && !this.settings.allowDeselect) || (option.disabled && !this.settings.allowDeselect)) {
            optionEl.classList.add(this.classes.disabled);
        }
        if (option.selected && this.settings.hideSelected) {
            optionEl.classList.add(this.classes.hide);
        }
        if (option.selected) {
            optionEl.classList.add(this.classes.optionSelected);
        }
        else {
            optionEl.classList.remove(this.classes.optionSelected);
        }
        optionEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const selectedOptions = this.store.getSelected();
            const element = e.currentTarget;
            const elementID = String(element.dataset.id);
            if (option.disabled || (option.selected && !this.settings.allowDeselect)) {
                return;
            }
            if (this.settings.isMultiple &&
                Array.isArray(selectedOptions) &&
                this.settings.maxSelected <= selectedOptions.length) {
                return;
            }
            let shouldUpdate = false;
            const before = this.store.getSelectedOptions();
            let after = [];
            if (this.settings.isMultiple) {
                if (option.selected) {
                    after = before.filter((o) => o.id !== elementID);
                }
                else {
                    after = before.concat(option);
                }
            }
            if (!this.settings.isMultiple) {
                if (option.selected) {
                    after = [];
                }
                else {
                    after = [option];
                }
            }
            if (!this.callbacks.beforeChange) {
                shouldUpdate = true;
            }
            if (this.callbacks.beforeChange) {
                if (this.callbacks.beforeChange(after, before) === false) {
                    shouldUpdate = false;
                }
                else {
                    shouldUpdate = true;
                }
            }
            if (shouldUpdate) {
                if (!this.store.getOptionByID(elementID)) {
                    this.callbacks.addOption(option);
                }
                this.callbacks.setSelected(after.map((o) => o.value));
                if (this.settings.closeOnSelect) {
                    this.callbacks.close();
                }
                if (this.callbacks.afterChange) {
                    this.callbacks.afterChange(after);
                }
            }
        });
        return optionEl;
    }
    destroy() {
        this.main.main.remove();
        this.content.main.remove();
    }
    highlightText(str, search, className) {
        let completedString = str;
        const regex = new RegExp('(' + search.trim() + ')(?![^<]*>[^<>]*</)', 'i');
        if (!str.match(regex)) {
            return str;
        }
        const matchStartPosition = str.match(regex).index;
        const matchEndPosition = matchStartPosition + str.match(regex)[0].toString().length;
        const originalTextFoundByRegex = str.substring(matchStartPosition, matchEndPosition);
        completedString = completedString.replace(regex, `<mark class="${className}">${originalTextFoundByRegex}</mark>`);
        return completedString;
    }
    moveContentAbove() {
        let mainHeight = this.main.main.offsetHeight;
        const contentHeight = this.content.main.offsetHeight;
        const height = mainHeight + contentHeight - 1;
        this.content.main.style.margin = '-' + height + 'px 0px 0px 0px';
        this.content.main.style.transformOrigin = 'center bottom';
        this.main.main.classList.remove(this.classes.openBelow);
        this.main.main.classList.add(this.classes.openAbove);
        this.content.main.classList.remove(this.classes.openBelow);
        this.content.main.classList.add(this.classes.openAbove);
    }
    moveContentBelow() {
        this.content.main.style.margin = '-1px 0px 0px 0px';
        this.content.main.style.transformOrigin = 'center top';
        this.main.main.classList.remove(this.classes.openAbove);
        this.main.main.classList.add(this.classes.openBelow);
        this.content.main.classList.remove(this.classes.openAbove);
        this.content.main.classList.add(this.classes.openBelow);
    }
    ensureElementInView(container, element) {
        const cTop = container.scrollTop + container.offsetTop;
        const cBottom = cTop + container.clientHeight;
        const eTop = element.offsetTop;
        const eBottom = eTop + element.clientHeight;
        if (eTop < cTop) {
            container.scrollTop -= cTop - eTop;
        }
        else if (eBottom > cBottom) {
            container.scrollTop += eBottom - cBottom;
        }
    }
    putContent(el, isOpen) {
        const height = el.offsetHeight;
        const rect = el.getBoundingClientRect();
        const elemTop = isOpen ? rect.top : rect.top - height;
        const elemBottom = isOpen ? rect.bottom : rect.bottom + height;
        if (elemTop <= 0) {
            return 'down';
        }
        if (elemBottom >= window.innerHeight) {
            return 'up';
        }
        return 'down';
    }
}

class Select {
    constructor(select) {
        this.listen = false;
        this.observer = null;
        this.select = select;
    }
    enable() {
        this.disconnectObserver();
        this.select.disabled = false;
        this.connectObserver();
    }
    disable() {
        this.disconnectObserver();
        this.select.disabled = true;
        this.connectObserver();
    }
    hideUI() {
        this.select.tabIndex = -1;
        this.select.style.display = 'none';
        this.select.setAttribute('aria-hidden', 'true');
    }
    showUI() {
        this.select.removeAttribute('tabindex');
        this.select.style.display = '';
        this.select.removeAttribute('aria-hidden');
    }
    changeListen(on) {
        this.listen = on;
        if (this.listen) {
            this.connectObserver();
        }
        else {
            this.disconnectObserver();
        }
    }
    addSelectChangeListener(func) {
        this.onSelectChange = func;
        this.addObserver();
        this.connectObserver();
        this.changeListen(true);
    }
    removeSelectChangeListener() {
        this.changeListen(false);
        this.onSelectChange = undefined;
    }
    addValueChangeListener(func) {
        this.onValueChange = func;
        this.select.addEventListener('change', this.valueChange.bind(this));
    }
    removeValueChangeListener() {
        this.onValueChange = undefined;
        this.select.removeEventListener('change', this.valueChange.bind(this));
    }
    valueChange(ev) {
        if (this.onValueChange) {
            this.onValueChange(this.getSelectedValues());
        }
    }
    observeWrapper(mutations) {
        if (this.onSelectChange) {
            this.changeListen(false);
            this.onSelectChange(this.getData());
            this.changeListen(true);
        }
    }
    addObserver() {
        if (this.observer) {
            this.disconnectObserver();
            this.observer = null;
        }
        this.observer = new MutationObserver(this.observeWrapper.bind(this));
    }
    connectObserver() {
        if (this.observer) {
            this.observer.observe(this.select, {
                childList: true,
            });
        }
    }
    disconnectObserver() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
    getData() {
        let data = [];
        const nodes = this.select.childNodes;
        for (const n of nodes) {
            if (n.nodeName === 'OPTGROUP') {
                data.push(this.getDataFromOptgroup(n));
            }
            if (n.nodeName === 'OPTION') {
                data.push(this.getDataFromOption(n));
            }
        }
        return data;
    }
    getDataFromOptgroup(optgroup) {
        let data = {
            id: '',
            label: optgroup.label,
            options: [],
        };
        const options = optgroup.childNodes;
        for (const o of options) {
            if (o.nodeName === 'OPTION') {
                data.options.push(this.getDataFromOption(o));
            }
        }
        return data;
    }
    getSelectedValues() {
        let values = [];
        const options = this.select.childNodes;
        for (const o of options) {
            if (o.nodeName === 'OPTGROUP') {
                const optgroupOptions = o.childNodes;
                for (const oo of optgroupOptions) {
                    if (oo.nodeName === 'OPTION') {
                        const option = oo;
                        if (option.selected) {
                            values.push(option.value);
                        }
                    }
                }
            }
            if (o.nodeName === 'OPTION') {
                const option = o;
                if (option.selected) {
                    values.push(option.value);
                }
            }
        }
        return values;
    }
    getDataFromOption(option) {
        return {
            id: (option.dataset ? option.dataset.id : false) || generateID(),
            value: option.value,
            text: option.text,
            html: option.innerHTML,
            selected: option.selected,
            display: option.style.display === 'none' ? false : true,
            disabled: option.disabled,
            mandatory: option.dataset ? option.dataset.mandatory === 'true' : false,
            placeholder: option.dataset.placeholder === 'true',
            class: option.className,
            style: option.style.cssText,
            data: option.dataset,
        };
    }
    setSelected(value) {
        const options = this.select.childNodes;
        for (const o of options) {
            if (o.nodeName === 'OPTGROUP') {
                const optgroup = o;
                const optgroupOptions = optgroup.childNodes;
                for (const oo of optgroupOptions) {
                    if (oo.nodeName === 'OPTION') {
                        const option = oo;
                        option.selected = value.includes(option.value);
                    }
                }
            }
            if (o.nodeName === 'OPTION') {
                const option = o;
                option.selected = value.includes(option.value);
            }
        }
    }
    updateSelect(id, style, classes) {
        this.changeListen(false);
        if (id) {
            this.select.id = id;
        }
        if (style) {
            this.select.style.cssText = style;
        }
        if (classes) {
            this.select.className = '';
            classes.forEach((c) => {
                if (c.trim() !== '') {
                    this.select.classList.add(c.trim());
                }
            });
        }
        this.changeListen(true);
    }
    updateOptions(data) {
        this.changeListen(false);
        this.select.innerHTML = '';
        for (const d of data) {
            if (d instanceof Optgroup) {
                this.select.appendChild(this.createOptgroup(d));
            }
            if (d instanceof Option) {
                this.select.appendChild(this.createOption(d));
            }
        }
        this.changeListen(true);
    }
    createOptgroup(optgroup) {
        const optgroupEl = document.createElement('optgroup');
        optgroupEl.id = optgroup.id;
        optgroupEl.label = optgroup.label;
        if (optgroup.options) {
            for (const o of optgroup.options) {
                optgroupEl.appendChild(this.createOption(o));
            }
        }
        return optgroupEl;
    }
    createOption(info) {
        const optionEl = document.createElement('option');
        optionEl.value = info.value !== '' ? info.value : info.text;
        optionEl.innerHTML = info.html || info.text;
        if (info.selected) {
            optionEl.selected = info.selected;
        }
        if (info.disabled) {
            optionEl.disabled = true;
        }
        if (info.display === false) {
            optionEl.style.display = 'none';
        }
        if (info.placeholder) {
            optionEl.setAttribute('data-placeholder', 'true');
        }
        if (info.mandatory) {
            optionEl.setAttribute('data-mandatory', 'true');
        }
        if (info.class) {
            info.class.split(' ').forEach((optionClass) => {
                optionEl.classList.add(optionClass);
            });
        }
        if (info.data && typeof info.data === 'object') {
            Object.keys(info.data).forEach((key) => {
                optionEl.setAttribute('data-' + kebabCase(key), info.data[key]);
            });
        }
        return optionEl;
    }
    destroy() {
        this.changeListen(false);
        this.disconnectObserver();
        this.removeSelectChangeListener();
        this.removeValueChangeListener();
        this.showUI();
    }
}

class Settings {
    constructor(settings) {
        this.id = '';
        this.style = '';
        this.class = [];
        this.isMultiple = false;
        this.isOpen = false;
        this.triggerFocus = true;
        this.intervalMove = null;
        this.mainHeight = 30;
        this.contentHeight = 0;
        if (!settings) {
            settings = {};
        }
        this.id = 'ss-' + generateID();
        this.style = settings.style || '';
        this.class = settings.class || [];
        this.isEnabled = settings.isEnabled !== undefined ? settings.isEnabled : true;
        this.alwaysOpen = settings.alwaysOpen !== undefined ? settings.alwaysOpen : false;
        this.showSearch = settings.showSearch !== undefined ? settings.showSearch : true;
        this.searchPlaceholder = settings.searchPlaceholder || 'Search';
        this.searchText = settings.searchText || 'No Results';
        this.searchingText = settings.searchingText || 'Searching...';
        this.searchHighlight = settings.searchHighlight !== undefined ? settings.searchHighlight : false;
        this.closeOnSelect = settings.closeOnSelect !== undefined ? settings.closeOnSelect : true;
        this.contentLocation = settings.contentLocation || document.body;
        this.contentPosition = settings.contentPosition || 'absolute';
        this.openPosition = settings.openPosition || 'auto';
        this.placeholderText = settings.placeholderText || 'Select Value';
        this.allowDeselect = settings.allowDeselect !== undefined ? settings.allowDeselect : false;
        this.hideSelected = settings.hideSelected !== undefined ? settings.hideSelected : false;
        this.showOptionTooltips = settings.showOptionTooltips !== undefined ? settings.showOptionTooltips : false;
        this.selectByGroup = settings.selectByGroup !== undefined ? settings.selectByGroup : false;
        this.minSelected = settings.minSelected || 0;
        this.maxSelected = settings.maxSelected || 1000;
        this.timeoutDelay = settings.timeoutDelay || 200;
    }
}

class SlimSelect {
    constructor(config) {
        this.events = {
            search: undefined,
            searchFilter: (opt, search) => {
                return opt.text.toLowerCase().indexOf(search.toLowerCase()) !== -1;
            },
            addable: undefined,
            beforeChange: undefined,
            afterChange: undefined,
            beforeOpen: undefined,
            afterOpen: undefined,
            beforeClose: undefined,
            afterClose: undefined,
        };
        this.windowResize = debounce(() => {
            if (!this.settings.isOpen) {
                return;
            }
            this.render.moveContent();
        });
        this.windowScroll = debounce(() => {
            if (!this.settings.isOpen) {
                return;
            }
            if (this.settings.openPosition === 'down') {
                this.render.moveContentBelow();
                return;
            }
            else if (this.settings.openPosition === 'up') {
                this.render.moveContentAbove();
                return;
            }
            if (this.settings.contentPosition === 'relative') {
                this.render.moveContentBelow();
            }
            else if (this.render.putContent(this.render.content.main, this.settings.isOpen) === 'up') {
                this.render.moveContentAbove();
            }
            else {
                this.render.moveContentBelow();
            }
        });
        this.documentClick = (e) => {
            if (!this.settings.isOpen) {
                return;
            }
            if (e.target && !hasClassInTree(e.target, this.settings.id)) {
                this.close();
            }
        };
        this.selectEl = (typeof config.select === 'string' ? document.querySelector(config.select) : config.select);
        if (!this.selectEl) {
            if (config.events && config.events.error) {
                config.events.error(new Error('Could not find select element'));
            }
            return;
        }
        if (this.selectEl.tagName !== 'SELECT') {
            if (config.events && config.events.error) {
                config.events.error(new Error('Element isnt of type select'));
            }
            return;
        }
        if (this.selectEl.dataset.ssid) {
            this.destroy();
        }
        this.settings = new Settings(config.settings);
        for (const key in config.events) {
            if (config.events.hasOwnProperty(key)) {
                this.events[key] = config.events[key];
            }
        }
        this.settings.isMultiple = this.selectEl.multiple;
        this.settings.style = this.selectEl.style.cssText;
        this.settings.class = this.selectEl.className.split(' ');
        this.select = new Select(this.selectEl);
        this.select.updateSelect(this.settings.id, this.settings.style, this.settings.class);
        this.select.hideUI();
        this.select.addSelectChangeListener((data) => {
            this.setData(data);
        });
        this.select.addValueChangeListener((values) => {
            this.setSelected(values);
        });
        this.store = new Store(this.settings.isMultiple ? 'multiple' : 'single', config.data ? config.data : this.select.getData());
        if (config.data) {
            this.select.updateOptions(this.store.getData());
        }
        const callbacks = {
            open: this.open.bind(this),
            close: this.close.bind(this),
            addable: this.events.addable ? this.events.addable : undefined,
            setSelected: this.setSelected.bind(this),
            addOption: this.addOption.bind(this),
            search: this.search.bind(this),
            beforeChange: this.events.beforeChange,
            afterChange: this.events.afterChange,
        };
        this.render = new Render(this.settings, this.store, callbacks);
        if (this.selectEl.parentNode) {
            this.selectEl.parentNode.insertBefore(this.render.main.main, this.selectEl.nextSibling);
        }
        document.addEventListener('click', this.documentClick);
        window.addEventListener('resize', this.windowResize, false);
        if (this.settings.openPosition === 'auto') {
            window.addEventListener('scroll', this.windowScroll, false);
        }
        if (!this.settings.isEnabled) {
            this.disable();
        }
        if (this.settings.alwaysOpen) {
            this.open();
        }
        this.selectEl.slim = this;
    }
    enable() {
        this.settings.isEnabled = true;
        this.select.enable();
        this.render.enable();
    }
    disable() {
        this.settings.isEnabled = false;
        this.select.disable();
        this.render.disable();
    }
    getData() {
        return this.store.getData();
    }
    setData(data) {
        const err = this.store.validateDataArray(data);
        if (err) {
            if (this.events.error) {
                this.events.error(err);
            }
            return;
        }
        this.store.setData(data);
        const dataClean = this.store.getData();
        this.select.updateOptions(dataClean);
        this.render.renderValues();
        this.render.renderOptions(dataClean);
    }
    getSelected() {
        return this.store.getSelected();
    }
    setSelected(value) {
        this.store.setSelectedBy('value', Array.isArray(value) ? value : [value]);
        const data = this.store.getData();
        this.select.updateOptions(data);
        this.render.renderValues();
        this.render.renderOptions(data);
    }
    addOption(option) {
        this.store.addOption(option);
        const data = this.store.getData();
        this.select.updateOptions(data);
        this.render.renderValues();
        this.render.renderOptions(data);
    }
    open() {
        if (!this.settings.isEnabled || this.settings.isOpen) {
            return;
        }
        if (this.events.beforeOpen) {
            this.events.beforeOpen();
        }
        this.render.open();
        if (this.settings.showSearch) {
            this.render.searchFocus(false);
        }
        setTimeout(() => {
            if (this.events.afterOpen) {
                this.events.afterOpen();
            }
            this.settings.isOpen = true;
        }, this.settings.timeoutDelay);
        if (this.settings.intervalMove) {
            clearInterval(this.settings.intervalMove);
        }
        this.settings.intervalMove = setInterval(this.render.moveContent.bind(this.render), 500);
    }
    close() {
        if (!this.settings.isOpen || this.settings.alwaysOpen) {
            return;
        }
        if (this.events.beforeClose) {
            this.events.beforeClose();
        }
        this.render.close();
        this.search('');
        this.render.mainFocus(false);
        setTimeout(() => {
            if (this.events.afterClose) {
                this.events.afterClose();
            }
            this.settings.isOpen = false;
        }, this.settings.timeoutDelay);
        if (this.settings.intervalMove) {
            clearInterval(this.settings.intervalMove);
        }
    }
    search(value) {
        if (this.render.content.search.input.value !== value) {
            this.render.content.search.input.value = value;
        }
        if (!this.events.search) {
            this.render.renderOptions(value === '' ? this.store.getData() : this.store.search(value, this.events.searchFilter));
            return;
        }
        this.render.renderSearching();
        const searchResp = this.events.search(value, this.store.getSelectedOptions());
        if (searchResp instanceof Promise) {
            searchResp
                .then((data) => {
                this.render.renderOptions(this.store.partialToFullData(data));
            })
                .catch((err) => {
                this.render.renderError(typeof err === 'string' ? err : err.message);
            });
            return;
        }
        else if (Array.isArray(searchResp)) {
            this.render.renderOptions(this.store.partialToFullData(searchResp));
        }
        else {
            this.render.renderError('Search event must return a promise or an array of data');
        }
    }
    destroy() {
        document.removeEventListener('click', this.documentClick);
        window.removeEventListener('resize', this.windowResize, false);
        if (this.settings.openPosition === 'auto') {
            window.removeEventListener('scroll', this.windowScroll, false);
        }
        this.store.setData([]);
        this.render.destroy();
        this.select.destroy();
    }
}

module.exports = SlimSelect;
