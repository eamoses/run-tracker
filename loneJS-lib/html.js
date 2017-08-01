class HtmlJS {

  constructor () {
    this.jsAtts = [
      'js-value'
    ]
  }

  update (updateData, root) {
    this.root = root
    this.getTag(updateData, 'var')
    this.getTag(updateData, 'for')
    this.getTag(updateData, 'if')
  }

  getTag (Obj, tag) { // Grabs All tags with 'tag' element
    const elm = this.root.querySelectorAll('['+tag+']')
    for (let i = elm.length-1; i >= 0; i--) { // Loop through all tags with 'for' element. Needs to be in reverse cuz nested loops need to run first.
      const tags = elm[i].childNodes.length // Snatch this value as a seperate because length of childnodes will change dynamically, creating INFINATE LOOPS OF PERIL!
      const txt = elm[i].getAttribute(tag)
      if (tag !== 'if') {
        if (!elm[i].hasAttribute('initial-innerhtml')) {
          const attr = document.createAttribute('initial-innerhtml')
          attr.value = elm[i].innerHTML
          elm[i].setAttributeNode(attr)
        } else {
          elm[i].innerHTML = elm[i].getAttribute('initial-innerhtml')
        }
      }
      switch (tag) {
        case 'var': this.varJS(Obj, elm[i], tags, txt.split(',')); break
        case 'for': this.forJS(Obj, elm[i], tags, txt.split(' ')); break
        case 'if': this.ifJS(Obj, elm[i], txt); break
      }
    }
  }

  varJS (Obj, elm, tags, arrVar) {
    for (const vLen of arrVar) {
      let [ hVar, jVar ] = vLen.split(' ').filter(Boolean)
      jVar = this.getDir(Obj, jVar)
      for (let j = 0; j < tags; j++) { // loop through all tags within element.
        const tag = elm.childNodes[j]
        if (tag.wholeText && tag.wholeText.split(/[\n\ ]/).filter(Boolean).length) {
          tag.nodeValue = this.place(tag.textContent.split(/[\n\ ]/), hVar, jVar).join(' ') // here's where the InnerHTML text is swapped to match JS variables.
        } // ^^^ takes text wrettin between tags and includes it.
        if (tag.contentEditable) { // there's extra DOM stuff we dont' need, This will only duplicate tags we created.
          tag.innerHTML = this.place(tag.innerHTML.split(/[\n\ ]/), hVar, jVar).join(' ') // here's where the InnerHTML text is swapped to match JS variables.
        }
      }
      //
      // HERE!!!!
      // this.parseAttr(updateData, 'js-value', tag)
      // this.parseAttr(elm, val, key, ind, parent)
      //
      //
    }
    // MAN... this should just go in GET TAG...
    // this.parseAttr(elm, val, key, ind, parent)

    console.log( elm, Obj);

  }

  forJS (Obj, elm, tags, [ node, parent ], [ val, key, ind ] = node.split(',')) {
    parent = this.getDir(Obj, parent)
    for (let child of elm.querySelectorAll(':scope > [is-clone]')) {
      elm.removeChild(child) // REMOVES all cloned elements from any previously loaded Doms.
    }
    tags = elm.childNodes.length
    for (const i in parent) { // Loop through all indices/keys within the Object
      for (let j = 0; j < tags; j++) { // loop through all tags within element.
        const tag = elm.childNodes[j]
        if (tag.contentEditable) {
          this.valueTypes(elm, i, tag, val, key, ind, parent) // there's extra DOM stuff we dont' need, This will only duplicate tags we created.
        }
      }
    }
    // MAN... this should just go in GET TAG...
    this.parseAttr(elm, val, key, ind, parent)
  }

  ifJS (Obj, elm, ifVar) {
    let hide = false
    if (ifVar[0] === '!') { hide = this.hasDir(Obj, ifVar.split('!')[1])
    } else { hide = !this.hasDir(Obj, ifVar) }
    hide ? elm.style.display = 'none' : elm.style.display = ''
  }


  parseAttr (elm, val, key, ind, jVal, textArr) {
    console.log(elm, val, key, ind, jVal);
    for (const att of this.jsAtts) {
      let elms = elm.querySelectorAll('['+att+']')
      for (var i = 0; i < elms.length-1; i++) {
      // for (const tag of elm.querySelectorAll('['+att+']')) {
        let tag = elms[i+1]
        let startArr = tag.getAttribute(att).split(/[\n\ ]/)
        // !!!!! make func??????
        if (val) textArr = this.place(startArr, val, jVal[i]) // here's where the InnerHTML text is swapped to match JS variables.
        if (key) textArr = this.place(startArr, key, i)
        if (ind) textArr = this.place(startArr, ind, Object.keys(jVal).indexOf(i))
        // !!!!! make func??????
        tag[att.split('js-')[1]] = textArr
      }
    }
  }

  hasDir (Obj, jVar) {
    for (const p of jVar.split(/[.\[\]]/).filter(Boolean)) {
      if (Obj[p]) {
        Obj = Obj[p]
      } else {
        return false
      }
    }
    return Obj.length > 0 && Obj !== 'false' ? true : false
  }

  getDir (Obj, jVar) { // Grab 'var' elm string. html var name = JS var
    for (const p of jVar.split(/[.\[\]]/).filter(Boolean)) Obj = Obj[p]
    return Obj
  }

  valueTypes (elm, i, tag, val, key, ind, jVal, textArr) {
    const startArr = tag.innerHTML.split(/[\n\ ]/)
    if (val) textArr = this.place(startArr, val, jVal[i]) // here's where the InnerHTML text is swapped to match JS variables.
    if (key) textArr = this.place(startArr, key, i)
    if (ind) textArr = this.place(startArr, ind, Object.keys(jVal).indexOf(i))
    if (this.showAtIndices(tag, i, jVal)) { // returns bool, if in the HTML indices attribute declares we shouldn't show this..
      this.newTag(elm, tag, textArr.join(' '), i)
      tag.style.display = 'none'
    }
  }

  place (arr, key, jVal) {
    for (const w in arr) {
      let pass = false
      if (typeof arr[w] === "object") arr[w] = JSON.stringify(arr[w]) // if var isn't a single value (meaning it's still an arr/obj) This will display the remaing data in JSON format.
      if (typeof arr[w] !== "string" || arr[w] === "") continue
      let r = arr[w][arr[w].length-1] === '-' ? '-' : '' // save if there's a hyphen at the bookends to shift later.
      let l = arr[w][0] === '-' ? '-' : ''
      const em = arr[w].split(/[\.\[\]]/).filter(Boolean)
      if ( em[0] && ((em[0] === key || em[0].slice(1) === key ) && em.length > 1)) {
        if (r) arr[w] = arr[w].slice(0, arr[w].length-1)
        if (l) arr[w] = arr[w].slice(1)
        arr[w] = this.getDir(jVal, '['+em.slice(1).join('][')+']')
        if ( l || r ) pass = true
      } // vvv this is where we used the left and right hyphens to shift if needed.
      if (arr[w] === l+key+r || pass) {
        const j = typeof jVal === 'object' ? arr[w] : jVal
        if (!l && !r)  arr[w] = jVal
        else if (l && r) arr.splice(w-1, 3, arr[w-1] + j + arr[parseInt(w)+1])
        else if (l && !r) arr.splice(w-1, 2, arr[w-1] + j)
        else if (!l && r) arr.splice(w, 2, j + arr[parseInt(w)+1])
      }
    }
    return arr
  }

  showAtIndices (tag, i, l, indices) {
    if (!Array.isArray(l)) i = Object.keys(l).indexOf(i).toString()
    if (tag.getAttribute('indices')) indices = tag.getAttribute('indices').split(' ') // If the tag has the custom indices attribute, catch it as array here.
    if (!indices) return true // if the tag doesn't have that attr, return 1 and make it.
    for (const j of indices) {
      if (j[0] === 's') if (!(i >= parseInt(j.substr(1)))) return false // start/don't show tags until
      if (j[0] === 'e') return (i <= parseInt(j.substr(1))) // end/stop showing tags at Nth
      if (j[0] === 'x') return ((i-1) % parseInt(j.substr(1))) // skip or show every Nth times
    }
    return (indices.includes(i) || indices.includes(':'+(l.length-i-1))) // return true if indices attribute contains index or reveerse index :N order
  }

  newTag (parent, tag, innerHTML, i) {
    let child = tag.cloneNode(true)
    const attr = document.createAttribute('is-clone')
    attr.value = true
    child.setAttributeNode(attr)
    child.innerHTML = innerHTML
    if (child.hasAttribute('serve')){
      const dir = this.getDir(data, parent.getAttribute('for').split(' ')[1])
      child.setAttribute('served', JSON.stringify(dir[i]))
    }
    parent.appendChild(child)
    child.style.display = ''
  }

}
