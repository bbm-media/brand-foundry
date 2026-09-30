/* Brand Foundry controls. Draft changes never trigger a render.
   Markup follows the shared control-rail primitives in app.css: one panel per
   group, a label and its live value on a single row, colors in a swatch grid. */
window.StudioControls = {
  validate(panel) {
    for (const input of panel.querySelectorAll('input,select,textarea')) {
      if (!input.reportValidity()) return false;
    }
    return true;
  },

  /* ---------- markup helpers ---------- */
  panelEl(title) {
    const section = document.createElement('section');
    section.className = 'rail-panel';
    const heading = document.createElement('h2');
    heading.textContent = title;
    section.append(heading);
    return section;
  },
  noteEl(text) {
    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = text;
    return note;
  },
  guidance(v) {
    const known = {
      metrics: ['Key results', 'Add a label and a value for each result, such as Hours saved and 24. Use your own verified data.'],
      imageList: ['Gallery images', 'Click an image to replace it. Add, remove or reorder images, then Save and preview.'],
      backgroundImage: ['Background image', 'Upload a photo, texture or gradient to place behind your content. Leave it empty to use the template background.'],
      backgroundFit: ['Image sizing', 'Fill the canvas crops the image to cover the frame. Show the whole image keeps every edge visible. Stretch to fit can distort it.'],
      backgroundPosition: ['Image alignment', 'Choose which part of the image stays in view when it is cropped.'],
      backgroundTreatment: ['Help text stand out', 'Adds a light or dark layer over the background image so text is easier to read. It only affects an image background.'],
      gridOpacity: ['Grid visibility', 'Controls the faint grid lines behind the content. 0 hides them; 1 shows their full template strength. It does not change your image opacity.'],
      durationSeconds: ['Video length (seconds)', 'The entire exported clip, including its opening, time on screen and ending. For example, 8 gives you an 8-second video.'],
      entranceSeconds: ['Animate in (seconds)', 'How long the text takes to appear at the beginning. Smaller numbers make the opening faster. The starter caps this at 45% of the video length.'],
      exitSeconds: ['Animate out (seconds)', 'How long the text takes to disappear at the end. Set 0 to keep it visible through the last frame. The starter caps this at 45% of the video length.']
    };
    const fallback = v.type === 'color' ? 'Choose the color for this part of the design.'
      : v.type === 'font' ? 'Choose a font, or inherit the font from Brand Settings.'
      : v.type === 'boolean' ? 'Turn this part of the template on or off.'
      : v.type === 'number' ? 'Adjust this value using the number box or slider.'
      : v.type === 'enum' ? 'Choose an option for this part of the design.'
      : 'Change the content shown in this field. Save and preview to apply it.';
    return {label: known[v.id]?.[0] || v.label || v.id, help: v.description || known[v.id]?.[1] || fallback};
  },
  helpEl(text, title, id) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'field-help'; button.textContent = 'i';
    button.setAttribute('aria-label', 'About ' + title);
    button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', id);
    const note = this.noteEl(text); note.id = id; note.hidden = true; note.classList.add('field-explanation');
    note.setAttribute('role', 'tooltip');
    let hideTimer;
    const hide = () => { clearTimeout(hideTimer); note.hidden = true; button.setAttribute('aria-expanded','false'); };
    const show = () => {
      clearTimeout(hideTimer); note.hidden = false; button.setAttribute('aria-expanded','true');
      const box = button.getBoundingClientRect();
      const width = Math.min(320, innerWidth - 24);
      note.style.width = width + 'px';
      note.style.left = Math.max(12, Math.min(box.right - width, innerWidth - width - 12)) + 'px';
      const height = note.getBoundingClientRect().height;
      note.style.top = (box.bottom + height + 10 <= innerHeight ? box.bottom + 8 : Math.max(8,box.top-height-8)) + 'px';
    };
    const leave = () => { hideTimer = setTimeout(hide, 120); };
    button.onmouseenter = show; button.onmouseleave = leave;
    note.onmouseenter = () => clearTimeout(hideTimer); note.onmouseleave = leave;
    button.onfocus = show; button.onblur = hide; button.onclick = show;
    button.onkeydown = event => { if(event.key === 'Escape'){hide();event.preventDefault();} };
    // Closing on scroll prevents a fixed tooltip from drifting away from its icon.
    button.addEventListener('mouseenter', () => window.addEventListener('scroll', hide, {once:true,passive:true}));
    return {button, note};
  },
  fieldEl(text, forId) {
    const field = document.createElement('div');
    field.className = 'fld';
    const label = document.createElement('label');
    label.htmlFor = forId;
    const name = document.createElement('span');
    name.textContent = text;
    label.append(name);
    const heading = document.createElement('div'); heading.className = 'field-heading';
    heading.append(label); field.append(heading);
    return { field, label, heading };
  },

  mount(panel, variables, values, changed, upload, size, styleHost = panel) {
    if(styleHost !== panel) styleHost.replaceChildren();
    const styleFields = variables.filter(v => v.type === 'color' || v.type === 'font');

    if (styleFields.length) {
      const section = this.panelEl('Style');
      const row = document.createElement('div'); row.className = 'rail-actions';
      const save = document.createElement('button'), apply = document.createElement('button');
      save.type = apply.type = 'button';
      save.className = apply.className = 'btn-sm';
      save.textContent = 'Save visual style'; apply.textContent = 'Apply saved style';
      const status = this.noteEl('');
      status.setAttribute('role', 'status');
      save.onclick = () => {
        try {
          localStorage.setItem('asset-studio:visual-style',
            JSON.stringify(Object.fromEntries(styleFields.map(v => [v.brandKey || v.id, values[v.id]]))));
          status.textContent = 'Style saved in this browser.';
        } catch { status.textContent = 'Browser storage is unavailable.'; }
      };
      apply.onclick = () => {
        try {
          const preset = JSON.parse(localStorage.getItem('asset-studio:visual-style') || 'null');
          if (!preset) { status.textContent = 'Save a style first.'; return; }
          for (const v of styleFields) {
            const value = preset[v.brandKey || v.id];
            if (typeof value === 'string' && (v.type !== 'color' || /^#[0-9a-f]{6}$/i.test(value))) values[v.id] = value;
          }
          changed();
          panel.textContent = '';
          this.mount(panel, variables, values, changed, upload, size, styleHost);
        } catch { status.textContent = 'Could not read the saved style.'; }
      };
      row.append(save, apply);
      section.append(row, this.noteEl('Reuse your chosen colors and fonts across templates. Saved in this browser only.'), status);
      styleHost.append(section);
    }

    const groups = new Map();
    const swatches = new Map();
    const backgroundOptions = new Map();
    const groupFor = v => v.group || (v.type === 'color' || v.type === 'font' ? 'Brand' : /background/i.test(v.id) ? 'Background' : 'Content');

    for (const v of variables) {
      const name = groupFor(v);
      if (!groups.has(name)) {
        const section = this.panelEl(name);
        panel.append(section);
        if (name === 'Background') section.append(this.noteEl('Use your own image or create a simple background. Save and preview applies your changes.'));
        if (name === 'Timing') section.append(this.noteEl('Choose the clip length, then how quickly the text appears and disappears. The remaining time holds the content on screen.'));
        groups.set(name, section);
      }
      const section = groups.get(name);
      const inputId = 'var-' + v.id;
      const guide = this.guidance(v);
      const help = this.helpEl(guide.help, guide.label, inputId + '-help');
      let target = section;
      if (name === 'Background' && ['backgroundFit','backgroundPosition','backgroundTreatment','gridOpacity'].includes(v.id)) {
        if (!backgroundOptions.has(section)) {
          const details = document.createElement('details'); details.className = 'background-options';
          const summary = document.createElement('summary'); summary.textContent = 'More background options';
          details.append(summary); section.append(details); backgroundOptions.set(section, details);
        }
        target = backgroundOptions.get(section);
      }

      /* Colors are dense enough to tile, so they get their own grid rather than
         one full-width row each. */
      if (v.type === 'color') {
        if (!swatches.has(section)) {
          const grid = document.createElement('div');
          grid.className = 'swatchgrid';
          section.append(grid);
          swatches.set(section, grid);
        }
        const cell = document.createElement('div');
        cell.className = 'swatch';
        const caption = document.createElement('label'); caption.htmlFor = inputId;
        caption.textContent = guide.label;
        const heading = document.createElement('div'); heading.className = 'swatch-heading';
        heading.append(caption, help.button);
        const input = document.createElement('input');
        input.type = 'color';
        input.id = inputId;
        input.value = values[v.id] ?? '';
        input.oninput = () => { values[v.id] = input.value; changed(); };
        input.setAttribute('aria-describedby', help.note.id);
        cell.append(heading, input, help.note);
        swatches.get(section).append(cell);
        continue;
      }

      const { field, label, heading } = this.fieldEl(guide.label, inputId);
      heading.append(help.button);
      if (v.ui === 'metrics' || v.id === 'metrics') {
        this.metricsField(field, v, values, changed); field.append(help.note); target.append(field); continue;
      }
      if (v.ui === 'image-list' || v.id === 'imageList') {
        this.galleryField(field, v, values, changed, upload, size); field.append(help.note); target.append(field); continue;
      }
      let input;

      if (v.type === 'enum' || v.type === 'font') {
        input = document.createElement('select');
        const options = v.options || ['Arial', 'Georgia', 'Verdana', 'Trebuchet MS', 'Courier New'].map(value => ({ value, label: value }));
        const friendlyOptions = {
          backgroundFit: {cover:'Fill the canvas (crop edges)',contain:'Show the whole image',fill:'Stretch to fit'},
          backgroundTreatment: {none:'No overlay',light:'Light overlay',dark:'Dark overlay'}
        };
        for (const o of options) input.add(new Option(friendlyOptions[v.id]?.[o.value] || o.label, o.value));
        if (!options.some(o => o.value === values[v.id])) input.add(new Option(String(values[v.id] || 'Inherit brand'), values[v.id] || ''));
      } else if (v.type === 'number' || v.type === 'boolean') {
        input = document.createElement('input');
        input.type = v.type === 'boolean' ? 'checkbox' : 'number';
        if (v.type === 'number') {
          input.step = v.step ?? 'any';
          if (v.min != null) input.min = v.min;
          if (v.max != null) input.max = v.max;
          input.required = true;
          input.className = 'num';
        } else {
          input.className = 'switch';
        }
      } else {
        input = document.createElement(
          v.multiline || String(v.default ?? '').length > 46 || /\n/.test(String(v.default ?? '')) ? 'textarea' : 'input');
      }

      input.id = inputId;
      input.setAttribute('aria-describedby', help.note.id);
      if (input.tagName === 'INPUT' && !input.hasAttribute('type')) input.type = 'text';
      input.value = values[v.id] ?? '';
      input.checked = values[v.id] === true || values[v.id] === 'true';
      input.oninput = () => {
        values[v.id] = v.type === 'boolean' ? input.checked
          : v.type === 'number' && input.value !== '' ? Number(input.value)
          : input.value;
        changed();
      };

      /* A number or a toggle rides in the label row; everything else sits under it. */
      if (v.type === 'number' || v.type === 'boolean') label.append(input);
      else field.append(input);

      if (v.type === 'number' && v.min != null && v.max != null) {
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = v.min; slider.max = v.max; slider.step = v.step ?? 'any';
        slider.value = values[v.id] ?? v.default;
        slider.setAttribute('aria-label', guide.label + ' slider');
        slider.setAttribute('aria-describedby', help.note.id);
        slider.oninput = () => { input.value = slider.value; input.oninput(); };
        input.addEventListener('input', () => { if (input.validity.valid) slider.value = input.value; });
        field.append(slider);
      }

      field.append(help.note);

      if (v.type === 'string' && !v.multiline && /image|img|photo|logo|shot/i.test(v.id)) {
        const file = document.createElement('input');
        file.type = 'file'; file.accept = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml'; file.hidden = true;
        const tag = document.createElement('span'); tag.className = 'setimg'; tag.setAttribute('role','status');
        const actions = document.createElement('div'); actions.className = 'rail-actions image-actions';
        const choose = document.createElement('button'), remove = document.createElement('button');
        choose.type = remove.type = 'button'; choose.className = 'btn-sm accent'; remove.className = 'btn-sm';
        remove.textContent = 'Remove image';
        const sync = () => { choose.textContent = values[v.id] ? 'Replace image' : 'Upload image'; remove.hidden = !values[v.id]; tag.textContent = values[v.id] ? 'Image added to draft' : 'No image added'; };
        choose.onclick = () => file.click();
        remove.onclick = () => { input.value = ''; file.value = ''; input.oninput(); sync(); };
        file.setAttribute('aria-label', 'Upload ' + guide.label);
        file.onchange = async () => {
          if (!file.files[0]) return;
          choose.disabled = remove.disabled = true; choose.textContent = 'Uploading…';
          try { await upload(v.id, file.files[0], tag); input.value = values[v.id] || ''; }
          finally { choose.disabled = remove.disabled = false; file.value = ''; sync(); }
        };
        // Keep paths available to agents and advanced users without leading with a blank text box.
        const pathDetails = document.createElement('details'); pathDetails.className = 'image-source';
        const pathSummary = document.createElement('summary'); pathSummary.textContent = 'Use an image URL or path';
        input.placeholder = 'https://… or assets/image.png'; input.setAttribute('aria-label', guide.label + ' URL or path');
        pathDetails.append(pathSummary, input);
        input.addEventListener('input', sync);
        actions.append(choose, remove); field.append(actions, tag, file);
        sync();
        if (/background/i.test(v.id)) this.background(field, v.id, values, async (...args) => { await upload(...args); sync(); }, input, tag, size);
        field.append(pathDetails);
      }

      target.append(field);
    }
  },

  imageUrl(value, size) {
    try { const url = new URL(value, location.origin + '/' + size.dir + '/'); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
  },
  metricsField(field, v, values, changed) {
    const max = v.maxItems || 3;
    const rows = String(values[v.id] || '').split(/\r?\n/).filter(Boolean).map(line => { const [label,...rest] = line.split('|'); return {label,value:rest.join('|')}; });
    const list = document.createElement('div'); list.className = 'metric-fields'; list.id = 'var-' + v.id;
    const add = document.createElement('button'); add.type = 'button'; add.className = 'btn-sm'; add.textContent = 'Add result';
    const save = () => { values[v.id] = rows.map(r => r.label + '|' + r.value).join('\n'); changed(); };
    const draw = () => {
      list.replaceChildren(); add.disabled = rows.length >= max;
      rows.forEach((row,i) => {
        const card = document.createElement('div'); card.className = 'metric-row';
        for (const key of ['label','value']) {
          const label = document.createElement('label'); label.textContent = key === 'label' ? 'Result label' : 'Value';
          const input = document.createElement('input'); input.type = 'text'; input.value = row[key]; input.required = true;
          input.placeholder = key === 'label' ? 'Hours saved' : '24'; input.setAttribute('aria-label', (key === 'label' ? 'Result label ' : 'Result value ') + (i+1));
          if(key === 'label'){input.pattern = '[^|]*';input.title = 'Use a label without the | character.';}
          input.oninput = () => { row[key] = input.value; save(); }; label.append(input); card.append(label);
        }
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn-sm'; remove.textContent = 'Remove'; remove.setAttribute('aria-label','Remove result '+(i+1));
        remove.onclick = () => { rows.splice(i,1); save(); draw(); }; card.append(remove); list.append(card);
      });
    };
    add.onclick = () => { if(rows.length>=max)return; rows.push({label:'',value:''});save();draw();list.lastElementChild.querySelector('input').focus(); };
    field.append(list,add,this.noteEl('Up to '+max+' results. Leave out any you do not need.')); draw();
  },
  galleryField(field, v, values, changed, upload, size) {
    const max = v.maxItems || 6;
    const paths = () => String(values[v.id] || '').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const list = document.createElement('div'); list.className = 'gallery-fields'; list.id = 'var-' + v.id;
    const status = this.noteEl('Click a thumbnail to replace it.'); status.setAttribute('role','status');
    const file = document.createElement('input'); file.type = 'file'; file.accept = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml';file.hidden=true;
    const add = document.createElement('button');add.type='button';add.className='btn-sm';add.textContent='Add images';
    let chosen=-1,busy=false;
    const choose = index => {if(busy)return;chosen=index;file.multiple=index<0;file.click();};
    const save = items => {values[v.id]=items.join('\n');changed();draw();};
    const draw = () => {
      list.replaceChildren();const items=paths();add.disabled=busy||items.length>=max;
      items.forEach((src,index) => {
        const card=document.createElement('div');card.className='gallery-card';
        const preview=document.createElement('button');preview.type='button';preview.className='gallery-image';preview.disabled=busy;
        preview.dataset.imageVariable=v.id;preview.dataset.imageIndex=index;preview.setAttribute('aria-label','Replace gallery image '+(index+1));preview.onclick=()=>choose(index);
        const img=document.createElement('img');img.src=this.imageUrl(src,size);img.alt='Gallery image '+(index+1);img.loading='lazy';
        const hint=document.createElement('span');hint.textContent='Replace image '+(index+1);preview.append(img,hint);
        img.onerror=()=>{img.hidden=true;hint.textContent='Image unavailable · Replace';};
        const actions=document.createElement('div');actions.className='gallery-actions';
        for(const [text,step] of [['Move earlier',-1],['Move later',1],['Remove',0]]){
          const button=document.createElement('button');button.type='button';button.className='btn-sm';button.textContent=step<0?'←':step>0?'→':'Remove';button.setAttribute('aria-label',text+' gallery image '+(index+1));button.disabled=busy||(step!==0&&(index+step<0||index+step>=items.length));
          button.onclick=()=>{const next=paths();if(step)[next[index],next[index+step]]=[next[index+step],next[index]];else next.splice(index,1);save(next);};actions.append(button);
        }
        card.append(preview,actions);list.append(card);
      });
    };
    file.onchange=async()=>{
      const selected=Array.from(file.files);if(!selected.length)return;busy=true;draw();status.textContent='Uploading…';
      let completed=0;
      try{for(const f of selected.slice(0,chosen<0?Math.max(0,max-paths().length):1)){const result=await upload(v.id,f,null,{listIndex:chosen});if(result)completed++;}}
      finally{busy=false;file.value='';draw();status.textContent=completed?'Images added to draft. Save and preview to apply.':'Upload failed. Your existing images are unchanged.';}
    };
    add.onclick=()=>choose(-1);field.append(list,add,file,status,this.noteEl('Up to '+max+' images. Their order here is their order in the design.'));draw();
  },

  background(field, id, values, upload, input, tag, size) {
    const box = document.createElement('details');
    const title = document.createElement('summary');
    title.textContent = 'Make a simple background';
    box.append(title);
    const style = document.createElement('select');
    for (const value of ['Gradient', 'Halo', 'Grid']) style.add(new Option(value, value));
    style.setAttribute('aria-label', 'Background style');
    const grid = document.createElement('div');
    grid.className = 'swatchgrid';
    const colors = [values.accentColor || '#2453ff', values.secondaryColor || '#5c7cff'].map((value, i) => {
      const cell = document.createElement('label');
      cell.className = 'swatch';
      const caption = document.createElement('span');
      caption.textContent = i ? 'Secondary' : 'Primary';
      const c = document.createElement('input');
      c.type = 'color'; c.value = value;
      c.setAttribute('aria-label', i ? 'Background secondary color' : 'Background primary color');
      cell.append(caption, c);
      grid.append(cell);
      return c;
    });
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'btn-sm'; button.textContent = 'Create background';
    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = 'Choose two colors and a style. Create background adds it to your draft; Save and preview applies it.';
    button.onclick = async () => {
      button.disabled = true;
      try {
        const svg = this.backgroundSvg(style.value, colors[0].value, colors[1].value, size.w, size.h);
        await upload(id, new File([svg], 'studio-background.svg', { type: 'image/svg+xml' }), tag);
        input.value = values[id] || '';
      } finally { button.disabled = false; }
    };
    box.append(style, grid, button, note);
    field.append(box);
  },

  backgroundSvg(style, a, b, w, h) {
    if (![a, b].every(c => /^#[0-9a-f]{6}$/i.test(c))) throw new Error('Invalid background colors');
    w = Math.max(1, Math.min(8192, Number(w) || 1080)); h = Math.max(1, Math.min(8192, Number(h) || 1080));
    const fill = style === 'Halo' ? 'radialGradient' : 'linearGradient';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><${fill} id="g"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></${fill}><pattern id="p" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke="white" stroke-opacity=".16"/></pattern></defs><path fill="url(#g)" d="M0 0H${w}V${h}H0z"/>${style === 'Grid' ? `<path fill="url(#p)" d="M0 0H${w}V${h}H0z"/>` : ''}</svg>`;
  }
};
