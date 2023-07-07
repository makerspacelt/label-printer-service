let ENABLE_PREVIEW = false

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

async function pdfToPNG(url, width, height) {
  const pdf = await pdfjsLib.getDocument(url).promise
  const page = await pdf.getPage(1)

  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  canvas.width = width || viewport.width
  canvas.height = height || viewport.height

  let viewport = page.getViewport({ scale: 1 })
  const scale = Math.min(width / viewport.width, height / viewport.height)
  viewport = page.getViewport({ scale })
  await page.render({ canvasContext: context, viewport: viewport }).promise

  return canvas.toDataURL()
}

function addImageToFabricCanvas(imageUrl, canvas) {
  const fabricImg = fabric.Image.fromURL(imageUrl, (fabricImg) => {
    canvas.add(fabricImg)
    updatePreviewPNGThrottled()
  }, {
    snapAngle: 15,
    snapThreshold: 15,
  })
}

function main(CONFIGS) {
  const supportedImagetypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  const fontNames = [
    'Karla Bold',
    'Source Sans Pro Regular',
    'Source Sans Pro Bold',
  ]
  const canvas = new fabric.Canvas('label-canvas')

  const configContainer = document.getElementById('printer-config-container')
  const rotateLabelContainer = document.getElementById('rotate-label-container')
  const rotateLabelEl = document.getElementById('rotate-label')
  const fontSelectContainer = document.getElementById('font-select-container')

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
  let rotateLabel = false
  let textareaCount = 1

  for (const fontName of fontNames) {
    fontSelectContainer.innerHTML += `
      <label style="font-family: ${fontName};"><input type="radio" name="font-select" value="${fontName}"> ${fontName}</label>
    `
  }
  const fontSelectEl = document.getElementById('font-select')

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

  rotateLabelEl.addEventListener('change', () => {
    rotateLabel = rotateLabelEl.checked
    updateLabelSize()
  })

  document.querySelectorAll('input[name="font-select"]').forEach(radioInput => {
    radioInput.addEventListener('change', (event) => {
      labelFont = event.target.value
      updateCanvasThrottled()
    })
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
    input.accept = supportedImagetypes.join(', ')
    input.addEventListener('change', async () => {
      const file = input.files[0]
      if (!file) return
      if (!supportedImagetypes.includes(file.type)) {
        alert(`Please select a valid file. Supported types: ${input.accept}`)
        return
      }
      if (file.type.includes('application/pdf')) {
        const imageUrl = await pdfToPNG(URL.createObjectURL(file), labelWidth, labelHeight)
        addImageToFabricCanvas(imageUrl, canvas)
      }
      else {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.addEventListener('load', () => {
          const imageUrl = reader.result
          addImageToFabricCanvas(imageUrl, canvas)
        })
      }
    })
    input.click()
  })

  function setConfig(config) {
    labelFont = config.font
    rotateLabelContainer.style.display = config.rotatable ? 'block' : 'none'
    if (!config.rotatable) {
      rotateLabel = false
    }
    document.querySelector(`input[name="font-select"][value="${labelFont}"]`).checked = true
    updateLabelSize()
  } 

  async function getFinalImage() {
    if (rotateLabel) {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = function() {
          const rotatedCanvas = document.createElement('canvas')
          const ctx = rotatedCanvas.getContext('2d')
          rotatedCanvas.width = img.height
          rotatedCanvas.height = img.width
          ctx.rotate(Math.PI / 2)
          ctx.drawImage(img, 0, -img.height)
          resolve(rotatedCanvas.toDataURL('image/png'))
        }
        img.src = canvas.toDataURL('image/png')
      })
    }
    else {
      return canvas.toDataURL('image/png')
    }
  }

  function updateLabelSize() {
    const h = rotateLabel ? currentConfig.width : currentConfig.height
    const w = rotateLabel ? currentConfig.height : currentConfig.width
    labelHeight = h
    labelWidth = w || 0 // 0 is infinity!
    labelCanvas.height = labelHeight
    labelCanvas.width = labelWidth
    updateCanvasThrottled()
  }

  function updatePrinterStatus() {
    const statusEls = document.querySelectorAll('.printer-status')
    const xhr = new XMLHttpRequest()
    xhr.open('GET', '/status', true)
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

  async function updatePreviewPNG() {
    if (ENABLE_PREVIEW) {
      previewImgContainer.style.display = 'block'
      previewImg.src = await getFinalImage()
    }
  }

  function updateCanvas() {
    canvas.clear()
    canvas.setBackgroundColor('white')

    const labelOffset = parseInt(globalOffsetInput.value, 10)
    const textareas = textareasContainer.querySelectorAll('textarea')
    let maxWidth = 0
    let totalOffset = 0

    // function createText(text, fontSize, left, top) {
    //   return new fabric.IText(text, {
    //     fontSize,
    //     fontFamily: labelFont,
    //     lineHeight: 1,
    //     snapAngle: 15,
    //     snapThreshold: 15,
    //     left,
    //     top,
    //   })
    // }

    const isInfiniteWidth = labelWidth === 0
    for (const textarea of textareas) {
      const textLines = textarea.value.split('\n')
      const lineCount = textLines.length
      const marginX = 100

      textLines.forEach((line, lineIndex) => {
        if (!line) {
          line = ' '
        }
        const lineHeight = labelHeight / textLines.length
        const text = new fabric.IText(line, {
          fontSize: isInfiniteWidth ? lineHeight : 1,
          fontFamily: labelFont,
          lineHeight: 1,
          snapAngle: 15,
          snapThreshold: 15,
        })

        if (isInfiniteWidth) {
          // Infinite width
          maxWidth = Math.max(maxWidth, text.getScaledWidth())
          text.set('left', totalOffset)
          text.set('top', text.height * lineIndex)
        }
        else {
          // Fixed width
          while (text.getScaledWidth() < (labelWidth - marginX) && text.getScaledHeight() < lineHeight && text.fontSize < 2000) {
            text.set('fontSize', text.fontSize + 1)
          }
          text.set('left', labelWidth / 2)
          text.set('top', lineIndex * lineHeight + lineHeight / 2)
          // text.set('top', text.fontSize / 2 + lineIndex * lineHeight)
          text.set('originX', 'center')
          text.set('originY', 'center')
        }

        canvas.add(text)
      })

      if (isInfiniteWidth) {
        totalOffset += labelWidth > 0 ? labelOffset : maxWidth + labelOffset
        maxWidth = 0
      }
    }

    canvas.setHeight(labelHeight)
    canvas.setWidth(isInfiniteWidth ? totalOffset : labelWidth)
    canvas.renderAll()

    canvasContainer.style.display = 'block'

    updatePreviewPNGThrottled()

    if (textareaCount > 1 && isInfiniteWidth) {
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

  downloadBtn.addEventListener('click', async () => {
    const link = document.createElement('a')
    link.href = await getFinalImage()
    link.download = 'label.png'
    link.click()
  })
  
  printBtn.addEventListener('click', async () => {
    printBtn.disabled = true
    printBtn.textContent = 'printing...'
    const imageDataURL = await getFinalImage()
    const arrayBuffer = dataURLToArrayBuffer(imageDataURL)
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
