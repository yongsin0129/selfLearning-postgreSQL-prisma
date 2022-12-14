import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient({ log: ['query'] })
const prisma = new PrismaClient()

async function main () {
  // delete 指定資料庫之前會檢查有沒有其他的 table 欄位為 require 並且跟此資料庫有 relation
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()
  await prisma.userPreferences.deleteMany()
  await prisma.category.deleteMany()

  /********************************************************************************
  *
            create
  *
  *********************************************************************************/
  // const user = await prisma.user.create({
  //   data: {
  //     name: 'Alice'
  //   }
  // })

  // const users = await prisma.user.findMany()
  // console.log(users)
  const user = await prisma.user.create({
    data: {
      name: 'kyle',
      email: 'kyle@example.com',
      age: 27,
      UserPreferences: {
        create: {
          emailUpdates: true
        }
      }
    },
    include: {
      UserPreferences: true
    }
    // 可指定部份欄位
    // select:{
    //   name: true,
    //   UserPreferences: {select : { id : true }}
    // }
  })
  // console.log(user)

  await prisma.user.deleteMany()
  await prisma.userPreferences.deleteMany()

  /********************************************************************************
  *
            create Many

            // 注意， createMany , findMany , updateMany , 回傳為 array , 部份 single 的屬性、方法不能用
            ex : include: {} , select: {} ...
  *
  *********************************************************************************/
  const usersCounts = await prisma.user.createMany({
    data: [
      {
        name: 'kyle',
        email: 'kyle@example.com',
        age: 27
      },
      {
        name: 'sally',
        email: 'sally@example.com',
        age: 22
      },
      {
        name: 'sally',
        email: 'sally32@example.com',
        age: 32
      },
      {
        name: 'sally',
        email: 'sally42@example.com',
        age: 42
      }
    ]
  })

  const categoryC = await prisma.category.create({
    data: {
      name: 'C'
    }
  })

  const UserPreferencesA = await prisma.userPreferences.create({
    data: {
      emailUpdates: true
    }
  })

  const vincent = await prisma.user.create({
    data: {
      name: 'vincent',
      email: 'vincent@example.com',
      age: 35,
      UserPreferencesId: UserPreferencesA.id
      // UserPreferences: {
      //   // 一對一的關係，直接 create 產生 , 或直接指定
      //   create: {
      //     emailUpdates: true
      //   }
      // }
    }
  })

  const newPost = await prisma.post.create({
    data: {
      title: 'vincent`s post',
      averageRating: 4.5,
      authorId: vincent.id, // 一對多的關係，直接帶入 id 即可
      categories: {
        // 因為 post category 是 多對多的關係，需要寫 create or connect , 不然直接指定 id 即可
        create: [{ name: 'A' }, { name: 'B' }], // 直接 create 其他 table 中的新資料
        connect: [{ id: categoryC.id }] // 連接其他 table 已經有的資料
        // 也可以使用 disconnect 讓兩個 table 關係消失
      }
    }
  })

  // console.log(usersCounts)

  /********************************************************************************
  *
            find operator

            // 可以找 Attr有 @unique 的欄位 ， 但 name 欄位就不行，因為沒有此屬性
            // 也可以找 @@unique([ bar, foo]) 的 combo 欄位 
  *
  *********************************************************************************/

  const uniqueUser = await prisma.user.findUnique({
    where: {
      email: 'kyle@example.com'
    }
  })
  // console.log(uniqueUser)

  const uniqueUser2 = await prisma.user.findUnique({
    where: {
      name_age: {
        name: 'sally',
        age: 22
      }
    }
  })
  // console.log(uniqueUser2)

  // findFirst,findMany 跟 findUnique 的差別是 where 內的值不會受到 unique attr 的限制 ， ex : name
  const userFirst = await prisma.user.findFirst({
    where: {
      name: 'sally'
    }
  })
  // console.log(userFirst)

  // findMany 回傳一個 array , 配合 operator 做多種操作
  const userMany = await prisma.user.findMany({
    where: {
      OR: [{ name: 'kyle' }, { name: 'sally' }]
    }
  })
  // console.log(userMany)

  /********************************************************************************
  *
            Filter operator
  *
  *********************************************************************************/

  // distinct
  const userManyDistinct = await prisma.user.findMany({
    where: {
      OR: [{ name: 'kyle' }, { name: 'sally' }]
    },
    distinct: ['name'] // 有三個 name 欄位都叫 sally ， 所以指定 name 欄位不能重複，就只會回傳第一個值
    // 補充 distinct: ['name' , 'age'] 如果寫成 name + age 的 combo ，就會出現三個 sally ， 因為 name + age 的組合不重複
  })
  // console.log(userManyDistinct)

  // take, skip , orderBy  (pagination) 取資料表的前二個 , 並 skip 掉第一個 , 另外注意資料生成的順序不一定是 date 的順序
  const userManyTake = await prisma.user.findMany({
    where: {
      OR: [{ name: 'kyle' }, { name: 'sally' }]
    },
    take: 3,
    skip: 1,
    orderBy: {
      age: 'desc' // asc
    }
  })
  // console.log(userManyTake)

  /********************************************************************************
  *
            filter operator advanced

            ex : and, or, not, in, equals,notIn
  *
  *********************************************************************************/
  const userManyFilterAdvanced = await prisma.user.findMany({
    where: {
      // name: { equals: 'sally' },
      // name: { not: 'sally' },
      // name: { in: ['sally', 'kyle'] }
      // name: { notIn: 'sally' },
      // name: { notIn: ['sally', 'foo'] },
      // age: { lt: 30 }
      // age: { gt: 32 }  不包含 32
      // age: { gte: 32 } 包含 32
      // age: { equals: 22 }
      // email: { contains: 'example' }
      // email: { endsWith: 'example.com' }
      // email: { startsWith: 'sally' }
      // AND: [{ name: { not: 'sally' } }, { email: { startsWith: 'kyle' } }]
      // OR: [{ email: { startsWith: 'kyle' } }, { email: { startsWith: 'sally' } }]
      // NOT: [{ email: { startsWith: 'kyle' } }, { email: { startsWith: 'sally' } }]
    }
  })
  // console.log(userManyFilterAdvanced.length)

  /********************************************************************************
  *
            filter operator relationship

            一對一
            一對多 兩者寫法不一樣
  *
  *********************************************************************************/

  const userManyFilterRelationshipOneToOne = await prisma.user.findMany({
    where: {
      UserPreferences: {
        emailUpdates: true
      }
    }
    // include: { writtenPosts: { include: { categories: true } } }
  })

  // 對於一對多，多對多關係，可以使用三個附加參數：every，some和none，來定義條件應該匹配every，some和none相關節點
  // some returns elements when any one of them matches the condition
  // while every returns elements when all of them matches the condition.
  const userManyFilterRelationship = await prisma.user.findMany({
    where: {
      // writtenPosts: { some: { title: 'vincent`s post' } } // 得到 vincent 的資料 , count : 1
      writtenPosts: { every: { title: 'foo`s post' } } // 得到 4個 all user 的資料 , 不包括 vincent
      // writtenPosts: { none: { title: 'vincent`s post' } } // 得到 4個 user 的資料 , 不包括 vincent
    }
  })

  const postFilterRelationships = await prisma.post.findMany({
    where: {
      author: {
        is: {
          name: 'vincent'
        }
      }
    },
    include: { author: true, categories: true }
  })

  // console.log(userManyFilterRelationshipOneToOne)

  /********************************************************************************
  *
            updating database

            method : update , updateMany

            注意 : 指定的值必需是 unique attr , 像 name 就不行
  *
  *********************************************************************************/

  const userUpdate = await prisma.user.update({
    where: {
      email: 'kyle@example.com'
    },
    data: {
      email: 'kyle@exampleUpdate.com',
      // age: { increment: 1 }
      age: { multiply: 20 }
    }
  })

  const userUpdateMany = await prisma.user.updateMany({
    where: { name: 'sally' },
    data: { name: 'new sally' }
  })

  /********************************************************************************
  *
            delete , disconnect

            prisma.model.delete or deleteMany
  *
  *********************************************************************************/

  // await prisma.user.delete({
  //   where: { id: userFoo.id }
  // })

  // await prisma.user.deleteMany({
  //   where : 指定資料
  // })

  await prisma.user.update({
    where: { email: 'vincent@example.com' },
    data: {
      UserPreferences: {
        disconnect: true
      },
      writtenPosts: {
        // disconnect: [{ id: 12 }, { id: 19 }],  指定部份資料取消關聯
        // set:[], 取消所有關聯 ， 需注意雙方資料庫的欄位是否為必需
        // deleteMany: {}, 刪除所有的關聯資料
        deleteMany: [{ id: newPost.id }] //刪除特定的關聯資料
      }
    }
  })

  const userFind = await prisma.user.findFirst({
    where: {
      email: { contains: 'vincent' }
    },
    include: { writtenPosts: true }
  })

  console.log(userFind)

  // 清空資料庫
  //   await prisma.post.deleteMany()
  //   await prisma.user.deleteMany()
  //   await prisma.userPreferences.deleteMany()
  //   await prisma.category.deleteMany()
}

/////////////////////////////////////////////////////////////////////////////
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
