import{ak as o,al as a,bi as t,bj as n,B as T}from"./index-CzpP-9qK.js";import{f as l,m as f}from"./directive-helpers-qp9t2k7Q.js";/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const E=o(class extends a{constructor(e){if(super(e),e.type!==t.PROPERTY&&e.type!==t.ATTRIBUTE&&e.type!==t.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!l(e))throw Error("`live` bindings can only contain a single expression")}render(e){return e}update(e,[r]){if(r===n||r===T)return r;const i=e.element,s=e.name;if(e.type===t.PROPERTY){if(r===i[s])return n}else if(e.type===t.BOOLEAN_ATTRIBUTE){if(!!r===i.hasAttribute(s))return n}else if(e.type===t.ATTRIBUTE&&i.getAttribute(s)===r+"")return n;return f(e),r}});export{E as l};
