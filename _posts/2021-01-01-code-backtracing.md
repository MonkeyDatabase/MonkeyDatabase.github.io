---
layout: post
title: 回溯法与剪枝
excerpt: "在刷算法题的过程中，常常遇到剪枝这个词，一般这种情况伴随着超时问题，回溯法可以大大缓解超时的问题，因此本文记录一些回溯法相关的知识"
date:   2021-01-01 16:28:00
categories: [code]
comments: true
---

## 定义

1. 二叉树在递归的过程中都会有回溯的操作，只不过有些情况下利用了回溯实现功能，有些情况下没有利用回溯
2. 回溯函数实际上指的是递归函数
3. 回溯法是纯暴力搜索法。虽然它是暴力搜索，但是有一些问题没有办法写出使用for循环暴力搜的代码，所以要依靠回溯法将所有结果搜出来。
   * 组合
   * 切割
   * 子集
   * 排列
   * 棋盘
4. 回溯法的输入大多为一个数组.
5. 回溯法可以抽象为一个n叉树
   * 树的宽度由输入数组的长度决定
   * 树的深度由递归深度决定，因为递归一定是有终止的，终止后一层一层的向上 返回
6. 重要变量
   * 递归函数的参数
   * 递归函数的返回值，一般为void
   * 递归函数的终止条件
   * 单层递归逻辑
7. 回溯法实际上是收集路径的过程，从树的根节点到所有叶子节点上的路径的集合
   * 一维数组path，用于存放根节点到某个叶子节点的路径
   * 二维数组result，用于存放所有的path

## 模板

```java
public void backtracking(T[] nums,int start,.......){
    if(stopcondition){
        result.add(new ArrayList<T>(temp));
        return;
    }
    for(T t :T[]){
        //some code deal with t;
        backtracking(..........);
        //some code back deal t;
    }
}
```

## 例题

### 1、子集

题目地址为[Leetcode 78](https://leetcode-cn.com/problems/subsets/)

#### 1.1 解题思路

1. 在顺序无关的回溯中画出的递归树中，选择列表的元素都是全集中在选择路径后面的元素，用来实现顺序无关，因此状态变量应为选择列表的起始位置startindex，即标识每一层的状态
   * 全集为[1,2,3]
   * 已经选中了0号元素数值为1，即选择路径为[1]，则此时start为1(数组序号从0开始)时，选择列表为[2,3]，即只要把[2,3]的所有子集算出来拼到已选出的元素后就是选中0号元素的全部子集
2. 子集问题是收集树中**根节点到所有节点**的信息。

#### 1.2 程序代码

```java
class Solution {
    List<Integer> path=new ArrayList<Integer>();
    List<List<Integer>> result=new ArrayList<List<Integer>>();

    public List<List<Integer>> subsets(int[] nums) {
        backtracing(nums,0);
        return result;
    }

    public void backtracing(int[] nums,int startindex){
        
        result.add(new ArrayList<Integer>(path));

        for(int i=startindex;i<nums.length;i++){
            path.add(nums[i]);
            backtracing(nums,i+1);
            path.remove(path.size()-1);
        }
    }
}
```

> 本题要注意的点是每次向result集合中add的时候需要根据temp创建一个新的List\<Integer\>对象，否则result中存储的所有的都是指向temp对象的索引，经过一系列add()和remove()操作改动的都是这个对象，导致最终输出时只能一堆空集

### 2、子集Ⅱ

题目地址为[Leetcode 90](https://leetcode-cn.com/problems/subsets-ii/)

#### 2.1 解题思路

1. 子集为顺序无关的，然而本题的输入中含有重复的元素，所以需要先进行按大小排序以便于判断是否要处理该节点。
2. 每个节点处理逻辑
   * 如果这是第一个待选，则直接考虑处理
   * 如果不是第一个待选，则它可能与它相邻的前一个是同样的数值，而子集是顺序无关的，因此只有这个值与它相邻的前一个不同时才进行处理

#### 2.2 程序代码

```java
class Solution {
    List<Integer> path=new ArrayList<Integer>();
    List<List<Integer>> result=new ArrayList<List<Integer>>();

    public List<List<Integer>> subsetsWithDup(int[] nums) {
        Arrays.sort(nums);
        backtracing(nums,0);
        return result;
    }

    public void backtracing(int[] nums,int startindex){
        result.add(new ArrayList<Integer>(path));

        for(int i=startindex;i<nums.length;i++){
            if(i==startindex||nums[i]!=nums[i-1]){
                path.add(nums[i]);
                backtracing(nums,i+1);
                path.remove(path.size()-1);
            }
        }
    }
}
```





### 3、组合

题目地址为[Leetcode 77](https://leetcode-cn.com/problems/combinations/)

#### 3.1 解题思路

1. 题目要求求出1...n之间所有k个数的组合
   * 当k=2时，我们可以用两层for循环求出结果，然而目前组合所用的k是动态改变的，所以传统暴力搜索法无法使用，只能依靠于回溯法解决无法动态增加for循环的问题。
   * 回溯法就是用递归来实现动态多层for循环，深一层递归就是子一层for循环。
2. 组合问题是收集满足条件的**根节点到叶子节点**的信息。
3. 抽象一个树形结构，假设输入为n=4，k=2
   * [1,2,3,4]
     * 取1，[2,3,4]
       * 取2，[3,4]剩余，得到集合[1,2]
       * 取3，[2,4]剩余，得到集合[1,3]
       * 取4，[2,3]剩余，得到集合[1,4]
     * 取2，[3,4]
       * 取3，[4]剩余，得到集合[2,3]
       * 取4，[3]剩余，得到集合[2,4]
     * 取3，[4]
       * 取4，[]剩余，得到集合[3,4]
     * 取4，\[\]选择列表为空，得不到结果
   * 本题为求组合，组合是顺序无关的，所以其内部元素不可重复使用，因此，第一次取2后的选择列表中没有1，因为这种情况已经被包括在第一次取1的情况中，因此需要设置一个startindex来指定每次搜索的起始位置。
4. 终止条件：路径的长度达到了k，达到了收集条件
5. 单层搜索逻辑：每一个节点是一个for循环，遍历从startindex开始到最后的数组的元素
   * path收集当前遍历到的元素
   * 递归调用遍历剩余元素
   * 回溯，将当前遍历的元素从path中剔除

#### 3.2 程序代码

```java
class Solution {
    List<Integer> path=new ArrayList<Integer>();
    List<List<Integer>> result=new ArrayList<List<Integer>>();
    public List<List<Integer>> combine(int n, int k) {
        backtracing(n,k,1);
        return result;
    }

    public void backtracing(int n,int k,int startindex){
        if(k==path.size()){
            result.add(new ArrayList<Integer>(path));
            return;
        }
        for(int i=startindex;i<=n;i++){
            path.add(i);
            backtracing(n,k,i+1);
            path.remove(path.size()-1);
        }
    }
}
```

