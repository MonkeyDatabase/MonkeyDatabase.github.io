---
layout: post
title: 行锁、间隙锁、临键锁
excerpt: "Mysql如果除了MVCC可以非阻塞并发读，有哪些方法通过方法通过阻塞加锁来实现隔离？"
date:   2021-01-08 20:42:00
categories: [Web]
comments: true
---

## 实践操作

样例表stu：

| id   | name | score |
| ---- | ---- | ----- |
| 1    | aaa  | 85    |
| 5    | bbb  | 90    |
| 8    | ccc  | 100   |
| 9    | ddd  | 110   |
| 11   | eee  | 111   |
| 15   | fff  | 1111  |

```sql
-- 创建表
create table if not exists `stu`(
    `id` int primary key auto_increment, 
    `name` char(255) not null, 
    `score` int not null
)engine=innodb,default charset=utf8;

-- 创建普通索引
create index score on stu(score);

-- 查看索引，可以看到两个以BTREE形式存储的索引
show index from stu;
```


| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
|-------|------------|----------|--------------|-------------|-----------|-------------|----------|--------|------|------------|---------|---------------|---------|------------|
| stu   |          0 | PRIMARY  |            1 | id          | A         |           6 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| stu   |          1 | score    |            1 | score       | A         |           5 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |


### 1、Record Lock

记录锁用于封锁记录，记录锁被称为行锁。

```sql
-- 连接1：启动事务1
begin;
select * from t_user where id between 12 and 15 for update;
select sleep(100);
commit;

-- 连接2：启动事务1后立即运行
select * from t_user where id=15 for update;

-- 连接3：启动事务2后立即运行
select * from t_user where id=14 for update;

-- 连接4：操作完连接3后立即点击
select * from t_user where id=15;
```

* 第一个连接会获取数据加上行锁
* 第二个连接最终返回”ERROR 1205 (HY000): Lock wait timeout exceeded; try restarting transaction“，因为id=15这一行的行锁已被第一个连接获取，第二个连接再去获取会被阻塞
* 第三个连接会立即返回空，因为查询不到结果，找不到目标去*for update*去申请行级锁
* 第四个连接可立即获取最终结果，因为并不获取锁

### 2、Gap Lock

间隙锁是为了解决可重复读隔离机制在当前读情境下的幻读问题。

> 幻读：事务A查询前后事务B插入了新数据，导致事务A读取前后的数据行数不同，大多出现在范围查找统计数据的情况下

1. 对聚簇索引(**主键索引**)进行范围查找并使用排他锁

   ```sql
   -- 事务1 范围查找为防止幻读，启用间隙锁和行级锁
   begin;
   select * from stu where id between 11 and 15 for update;
   select sleep(10);
   commit;
   
   -- 事务2 被阻塞
   begin;
   insert into stu (id,name,score) values (14,'qwer',889);
   commit;
   
   -- 事务3 被阻塞
   begin;
   insert into stu (id,name,score) values (17,'qwer',889);
   commit;
   ```

2. 对聚簇索引(**主键索引**)进行等值查找，如果值不存在，不会启用间隙锁，因为使用等值查找不会出现幻读问题，因此不必产生间隙锁

   ```sql
   -- 事务1 范围查找为防止幻读，启用间隙锁
   begin;
   select * from stu where id = 13 for update;
   select sleep(10);
   commit;
   
   -- 事务2 立即执行
   begin;
   insert into stu (id,name,score) values (14,'qwer',889);
   commit;
   
   -- 事务3 立即执行
   begin;
   insert into stu (id,name,score) values (17,'qwer',889);
   commit;
   ```

3. 对**普通索引**进行**等值查找**，查找不存在的值，会触发间隙锁

   ```sql
   -- 事务1 Innodb非聚簇索引查找时最终走到间隙中，导致启用间隙锁(111,120]∪[120,1111)
   begin;
   select * from stu where score =120 for update;
   select sleep(1000);
   commit;
   
   -- 事务2 因为在间隙锁之外，立即完成
   begin;
   insert into stu (id,name,score) values(16,'dsf',110);
   commit;
   
   -- 事务3 因为在间隙锁范围内，被阻塞
   begin;
   insert into stu (id,name,score) values(17,'dsf',119);
   commit;
   
   -- 事务4 因为在间隙锁范围内，被阻塞
   begin;
   insert into stu (id,name,score) values(18,'dsf',130);
   commit;
   
   -- 事务5 因为在间隙锁范围外，立即完成
   begin;
   insert into stu (id,name,score) values(19,'dsf',1111);
   commit;
   ```

4. 对**普通索引**进行**等值查找**，查找存在的值，会触发间隙锁

   ```sql
   -- 事务1 Innodb非聚簇索引查找时最终走到索引，导致启用间隙锁和记录锁(111,1111]∪[1111,MAX)
   begin;
   select * from stu where score =1111 for update;
   select sleep(1000);
   commit;
   
   -- 事务2 进入间隙锁，被锁定
   begin;
   insert into stu (id,name,score) values(23,'dsf',511);
   commit;
   
   -- 事务3 进入间隙锁，被锁定
   begin;
   insert into stu (id,name,score) values(24,'dsf',2111);
   commit;
   ```

5. 对**普通索引**进行等值查找当值不存在时都会产生间隙锁，**范围查找**必然也会触发间隙锁

## 实验结论

1. 记录锁、间隙锁、临键锁都属于排他锁

2. 记录锁是锁住一条表中的索引记录

3. 间隙锁是锁住一个表中的间隙，产生条件：

   * 事务隔离级别可重复读

   * 索引类型(按功能来分)
     * 普通索引
       * 范围查找
       * 等值查找
     * 唯一索引
       * 范围查找
       * 等值查找某一个**不存在**的值
     * 联合索引
       * 范围查找
       * 等值查找
         * 各个索引成员各自负责是否有锁