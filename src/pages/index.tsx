import { GetServerSideProps } from "next";
import { Inter } from "next/font/google";
import { useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

type TransactionItem = {
  id: string;
  name: string;
  price: number;
  amount: number;
};

type Transaction = {
  datetime: string;
  items: TransactionItem[];
};

export const getServerSideProps: GetServerSideProps<HomeProps> = async (
  ctx
) => {
  const queryId = ctx.query.id;
  const id = Array.isArray(queryId) ? queryId[0] : queryId ?? "";
  if (!id) {
    throw new Error("no id found");
  }

  const resTransaction = await fetch(
    `https://coda.io/apis/v1/docs/Etowgn8Bmj/tables/Kafe Transactions/rows/${id}?useColumnNames=true&valueFormat=simpleWithArrays`,
    {
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    }
  ).then((res) => res.json());

  const resTransactionItems = await Promise.all(
    resTransaction.values.Items.map((item: string) =>
      fetch(
        `https://coda.io/apis/v1/docs/Etowgn8Bmj/tables/Kafe Transaction Items/rows/${item}?useColumnNames=true&valueFormat=rich`,
        {
          headers: {
            Authorization: `Bearer ${process.env.API_TOKEN}`,
          },
        }
      ).then((res) => res.json())
    )
  );

  const transaction: Transaction = {
    datetime: resTransaction.createdAt,
    items: resTransactionItems.map((item: any) => ({
      id: item.id,
      name: item.values.Menu.name,
      amount: item.values.Amount,
      price: item.values.Price.amount,
    })),
  };

  return { props: { transaction } };
};

type HomeProps = {
  transaction: Transaction;
};

export default function Home({ transaction }: HomeProps) {
  useEffect(() => {
    window.print();
  }, []);

  return (
    <>
      <main className={`${inter.className}`}>
        <h1>Gatherkafe</h1>
        <p>Basecamp Gatherloop, Jl. Sahara Perum. New Kraksaan Land Blok G16</p>
        <hr />
        {transaction.items.map(({ id, name, amount, price }) => (
          <div key={id}>
            <p>{name}</p>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <p>
                {amount} x Rp. {price.toLocaleString("id")}
              </p>
              <p>Rp. {(amount * price).toLocaleString("id")}</p>
            </div>
          </div>
        ))}
        <p style={{ display: "flex", justifyContent: "flex-end" }}>
          Total : Rp.{" "}
          {transaction.items
            .reduce((prev, curr) => prev + curr.amount * curr.price, 0)
            .toLocaleString("id")}
        </p>
      </main>
    </>
  );
}
