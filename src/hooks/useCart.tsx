import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const product = await api(`http://localhost:3333/products/${productId}`).then((res) => {
        return res.data;
      });

      const stock = await api(`http://localhost:3333/stock/${productId}`).then((res) => {
        return res.data;
      });

      const productAlreadyOnCartIndex = cart.findIndex((product) => product.id === productId);

      if (productAlreadyOnCartIndex !== -1) {
        const newCart = [...cart];

        const product = { ...cart[productAlreadyOnCartIndex] };

        if (product.amount === stock.amount) {
          toast.error("Quantidade solicitada fora de estoque");
        } else {
          product.amount += 1;
          newCart[productAlreadyOnCartIndex] = product;
          setCart(newCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        }
      } else {
        const productToAdd = { ...product, amount: 1 };
        const newCart = [...cart, productToAdd];
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }
    } catch (err) {
      err && toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productToRemove = cart.find((product) => product.id === productId);
      if (!productToRemove) throw new Error();
      const newCart = cart.filter((product) => product !== productToRemove);
      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch (err) {
      err && toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    if (amount <= 0) return;
    try {
      const stock = await api(`http://localhost:3333/stock/${productId}`).then((res) => {
        return res.data;
      });

      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      } else {
        const index = cart.findIndex((product) => product.id === productId);

        const newCart = [...cart];

        newCart[index].amount = amount;

        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }
    } catch (err) {
      err && toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return <CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
