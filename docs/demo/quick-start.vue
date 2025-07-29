<template>
    <div>Hello enhance-data-view</div>
</template>

<script lang="ts" setup>
import { defineArray, defineString, defineStruct, types, reactive, toRaw } from "enhance-data-view";

// 定义结构体类型
const PERSON = defineStruct()
    // id 属性：UINT_32 类型
    .addProperty("id", types.UINT_32)
    // name 属性：长度为 10 的字符串类型
    .addProperty("name", defineString(10, 0).freeze())
    // friends 属性：长度为 4 的 UINT_32 数组类型
    .addProperty("friends", defineArray(types.UINT_32, 4).freeze())
    .freeze();

// 使用 'PERSON.size' 来获取类型的字节大小
const dataView = new DataView(new ArrayBuffer(PERSON.size));
// Make dataView reactive ✨
const person = reactive(dataView, PERSON, 0, true);
// Typescript 自动推断出 person 的类型如下: 
// const person: {
//     id: number;
//     name: string;
//     friends: number[];
// }

// 向 DataView 写入数据
person.id = 1;
person.name = "MrKBear";
person.friends = [2, 3, 4, 5];
person.friends[1] = 0xff;

// 从 dataView 中读取数据
console.log(dataView.buffer);
// <01 00 00 00 
//  4d 72 4b 42 65 61 72 00 00 00 00 00
//  02 00 00 00 ff 00 00 00 04 00 00 00 05 00 00 00>
console.log(person.id); // 1
console.log(person.name); // MrKBear
console.log(person.friends[1]); // 255
// 转换为原始对象
console.log(toRaw(person)); // { id: 1, name: "MrKBear", friends: [2, 255, 4, 5] }
console.log(toRaw(person.friends)); // [2, 255, 4, 5]
</script>