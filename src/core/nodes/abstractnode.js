/*
Copyright 2020 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe. 
*/


const { trace } = require("../../utils/debug");
const { Parameter } = require("../parameter");
const { Layout } = require("../decorators/layout");

// Abstract class representing the minimum interface required for an export node.
class AbstractNode {
	// Nodes should also have a static `create(xdNode, ctx)` method
	// that returns an instance if appropriate for the xdNode.

	constructor(xdNode, ctx) {
		this.xdNode = xdNode;
		this.parameters = null;
		this.children = null;
		this.decorators = null;
		this.hasDecorators = false; // indicates this node has non-cosmetic decorators.
		this.layout = new Layout(this, ctx);
		this._cache = null;
	}

	get hasChildren() {
		return !!(this.children && this.children.length);
	}

	get responsive() {
		return !!this.xdNode.horizontalConstraints;
	}

	get xdId() {
		return this.xdNode ? this.xdNode.guid : null;
	}

	get xdName() {
		return this.xdNode ? this.xdNode.name : null;
	}

	get adjustedBounds() {
		let xdNode = this.xdNode, size = xdNode.parent.localBounds;
		let pb = xdNode.boundsInParent, lb = xdNode.localBounds;
		return {x: pb.x - size.x, y: pb.y - size.y, width: lb.width, height: lb.height};
	}

	addDecorator(decorator) {
		this.decorators = this.decorators || [];
		this.decorators.push(decorator);
		if (!decorator.cosmetic) { this.hasDecorators = true; }
	}

	addParam(key, name, type, value) {
		if (!name || !key) { return null; }
		let param = new Parameter(name, type, value);
		if (!this.parameters) { this.parameters = {}; }
		return this.parameters[key] = param;
	}

	getParam(key) {
		return this.parameters && this.parameters[key];
	}

	getParamName(key) {
		let param = this.getParam(key);
		return (param && param.name) || null;
	}

	adjustTransform(mtx) {
		return mtx;
	}

	toString(ctx) {
		return `[${this.constructor.name}]`;
	}

	serialize(ctx) {
		if (this._cache === null) {
			let nodeStr = this._serialize(ctx);
			this._cache = this._decorate(nodeStr, ctx);
		}
		return this._cache;
	}

	_serialize(ctx) {
		return "";
	}

	_decorate(nodeStr, ctx) {
		if (!nodeStr) { return nodeStr; }
		let decorators = this.decorators, l = nodeStr && decorators ? decorators.length : 0;
		for (let i=0; i<l; i++) { nodeStr = decorators[i].serialize(nodeStr, ctx); }
		if (this.layout) { nodeStr = this.layout.serialize(nodeStr, ctx); }
		return nodeStr;
	}

	_getChildList(ctx) {
		let result = "";
		this.children.forEach(node => {
			let childStr = node && node.serialize(ctx);
			if (childStr) { result += childStr + ", "; }
		});
		return result;
	}

	_getChildStack(ctx) {
		return `Stack(children: <Widget>[${this._getChildList(ctx)}], )`;
	}
}
exports.AbstractNode = AbstractNode;
