function throttle(fn, wait) {
  let lastCallAt = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastCallAt > wait) {
      setTimeout(function() {
        lastCallAt = now
        fn(...args)
      }, wait)
    }
    else {
      lastCallAt = now
      fn(...args)
    }
  }
}

function dataURLToArrayBuffer(dataURL) {
  // Decode the base64 data URL
  const byteString = atob(dataURL.split(',')[1])

  // Create an ArrayBuffer for the decoded data
  const arrayBuffer = new ArrayBuffer(byteString.length)

  // Create a view (Uint8Array) for the ArrayBuffer
  const uint8Array = new Uint8Array(arrayBuffer)

  // Copy the decoded data into the view
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i)
  }

  return arrayBuffer
}

function main(CONFIGS) {
  const fontNames = [
    'Source Sans Pro Regular',
    'Source Sans Pro Bold',
    'Source Sans Pro Black',
  ]
  const canvas = new fabric.Canvas('label-canvas')

  const configContainer = document.getElementById('printer-config-container')
  const fontSelectEl = document.getElementById('font-select')

  const canvasContainer = document.getElementById('canvas-container')
  const labelCanvas = document.getElementById('label-canvas')
  const centeringContainer = document.getElementById('centering-container')
  const centerHBtn = document.getElementById('centerh-btn') 
  const centerVBtn = document.getElementById('centerv-btn') 

  const textareasContainer = document.getElementById('textareas-container')
  const textarea1 = document.getElementById('textarea-1')
  const addTextareaBtn = document.getElementById('add-textarea')
  const loadImageBtn = document.getElementById('load-image')

  const globalOffsetContainer = document.getElementById('global-offset-container')
  const globalOffsetInput = document.getElementById('global-offset')

  const previewImgContainer = document.getElementById('preview-container')
  const previewImg = document.getElementById('preview-img')

  const downloadBtn = document.getElementById('download-btn')
  const printBtn = document.getElementById('print-btn')

  const updateCanvasThrottled = throttle(updateCanvas, 50)
  const updatePreviewPNGThrottled = throttle(updatePreviewPNG, 100)

  let currentConfig = CONFIGS[0]
  let labelHeight = 0
  let labelWidth = 0
  let labelFont = ''
  let textareaCount = 1

  for (const fontName of fontNames) {
    const option = document.createElement('option')
    option.text = fontName
    fontSelectEl.add(option)
  }

  setConfig(currentConfig)

  CONFIGS.forEach((c) => {
    const el = document.createElement('div')
    el.className = 'printer-config'
    el.setAttribute('name', c.name)
    if (currentConfig === c) {
      el.classList.add('printer-config-active')
    }
    el.innerHTML = `
      <img class="printer-photo" src="${c.photo}" width=150 height=150>
      <div class="printer-name">${c.name}</div>
      <div class="printer-label-size">${c.width}×${c.height} px</div>
      <div>Status: <span class="printer-status">unknown</span></div>
    `
    el.querySelector('.printer-status').setAttribute('data-id', c.id)
    el.onclick = function() {
      document.querySelectorAll('.printer-config').forEach(node => {
        node.classList.remove('printer-config-active')
      })
      this.classList.add('printer-config-active')
      const selectedName = this.getAttribute('name')
      currentConfig = CONFIGS.find(c => c.name == selectedName)
      setConfig(currentConfig)
    }
    configContainer.appendChild(el)
  })

  fontSelectEl.addEventListener('change', () => {
    labelFont = fontSelectEl.value
    updateCanvasThrottled()
  })

  globalOffsetInput.addEventListener('input', updateCanvasThrottled)
  textarea1.addEventListener('input', updateCanvasThrottled)

  addTextareaBtn.addEventListener('click', () => {
    textareaCount++
    const lastWrapper = document.querySelector('.textarea-wrapper:last-child')
    const newWrapper = document.createElement('div')
    newWrapper.classList.add('textarea-wrapper')
    newWrapper.innerHTML = lastWrapper.innerHTML
    newWrapper.querySelector('.textarea-label').textContent = `Label ${textareaCount} Text`
    const removeLabelBtn = newWrapper.querySelector('.remove-label-btn')
    removeLabelBtn.style.display = 'inline'
    removeLabelBtn.onclick = function() {
      textareasContainer.removeChild(newWrapper)
      textareaCount = document.querySelectorAll('.textarea-wrapper').length
      updateCanvasThrottled()
    }

    const newTextarea = newWrapper.querySelector('textarea')
    newTextarea.id = `label-text-${textareaCount}`
    newTextarea.value = lastWrapper.querySelector('textarea').value
    newTextarea.addEventListener('input', updateCanvasThrottled)
    textareasContainer.appendChild(newWrapper)
    updateCanvasThrottled()
  })
  
  loadImageBtn.addEventListener('click', () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg, image/png, image/gif'
    input.addEventListener('change', () => {
      const file = input.files[0]
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.addEventListener('load', () => {
        const imageUrl = reader.result
        fabric.Image.fromURL(imageUrl, (fabricImg) => {
          canvas.add(fabricImg)
          updatePreviewPNGThrottled()
        }, {
          snapAngle: 15,
          snapThreshold: 15,
        })
      })
    })
    input.click()
  })

  function setConfig(config) {
    labelHeight = config.height
    labelWidth = config.width || 0 // 0 is infinity!
    labelCanvas.height = labelHeight
    labelCanvas.width = labelWidth
    labelFont = currentConfig.font
    fontSelectEl.value = labelFont
    updateCanvasThrottled()
  } 

  function updatePrinterStatus() {
    const statusEls = document.querySelectorAll('.printer-status')
    const xhr = new XMLHttpRequest()
    xhr.open('GET', '/status', true);
    xhr.timeout = 2000
    xhr.onload = () => {
      if (xhr.status == 200) {
        const status = JSON.parse(xhr.responseText)
        statusEls.forEach(el => {
          const id = el.getAttribute('data-id')
          el.textContent = status[id].ok ? (status[id].task_count ? 'busy' : 'ready') : 'offline'
        })
      }
    }
    xhr.onerror = () => {
      statusEls.forEach(el => el.textContent = 'Network error')
    }
    xhr.ontimeout = () => {
      statusEls.forEach(el => el.textContent = 'Network timeout')
    }
    xhr.send(null)
  }

  function updatePreviewPNG() {
    previewImgContainer.style.display = 'block'
    previewImg.src = canvas.toDataURL('image/png')
  }

  function updateCanvas() {
    canvas.clear()
    canvas.setBackgroundColor('white')

    const labelOffset = parseInt(globalOffsetInput.value, 10)
    const textareas = textareasContainer.querySelectorAll('textarea')
    let maxWidth = 0
    let totalOffset = 0

    for (const textarea of textareas) {
      const textLines = textarea.value.split('\n')
      const lineHeight = Math.min(128, labelHeight / textLines.length)

      textLines.forEach((line, index) => {
        const text = new fabric.IText(line, {
          fontSize: lineHeight,
          fontFamily: labelFont,
          // fontWeight: 'bold',
          // fontFamily: 'Arial',
          lineHeight: 1,
          snapAngle: 15,
          snapThreshold: 15,
          left: totalOffset,
          top: lineHeight * index,
        })
        maxWidth = Math.max(maxWidth, text.getScaledWidth())
        canvas.add(text)
      })

      totalOffset += labelWidth > 0 ? labelOffset : maxWidth + labelOffset
      maxWidth = 0
    }

    canvas.setHeight(labelHeight)
    canvas.setWidth(labelWidth > 0 ? labelWidth : totalOffset)
    canvas.renderAll()

    canvasContainer.style.display = 'block'

    updatePreviewPNGThrottled()

    if (textareaCount > 1 && labelWidth <= 0) {
      globalOffsetContainer.style.display = 'block'
    }
    else {
      globalOffsetContainer.style.display = 'none'
    }
  }

  canvas.on('object:modified', (e) => {
    updatePreviewPNGThrottled()
  })

  canvas.on('selection:cleared', (e) => {
    centeringContainer.style.display = 'none'
    updatePreviewPNGThrottled()
  })

  canvas.on('selection:created', (e) => {
    centeringContainer.style.display = 'block'
    updatePreviewPNGThrottled()
  })

  centerHBtn.addEventListener('click', function() {
    const selection = canvas.getActiveObject()
    if (selection) {
      canvas.centerObjectH(selection)
    }
  })

  centerVBtn.addEventListener('click', function() {
    const selection = canvas.getActiveObject()
    if (selection) {
      canvas.centerObjectV(selection)
    }
  })

  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'label.png'
    link.click()
  })
  
  printBtn.addEventListener('click', async () => {
    printBtn.disabled = true
    printBtn.textContent = 'printing...'
    const arrayBuffer = dataURLToArrayBuffer(canvas.toDataURL('image/png'))
    try {
      await fetch(currentConfig.url, {
        method: 'POST',
        headers: { 'Content-Type': 'image/png' },
        body: arrayBuffer,
      })
    }
    finally {
      printBtn.disabled = false
      printBtn.textContent = 'Print Label'
    }
  })

  if (textarea1.value) {
    updateCanvasThrottled()
  }

  setInterval(updatePrinterStatus, 3000)
  updatePrinterStatus()
}
