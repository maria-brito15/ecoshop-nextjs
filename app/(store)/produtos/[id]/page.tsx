"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Produto {
  id: number;
  nome: string;
  preco: number;
  imagem?: string;
  image?: string;
  descricao?: string;
  id_categoria?: number;
}

interface Categoria {
  id: number;
  nome: string;
}

export default function ProdutoPage() {
  const params = useParams();
  const id = params.id as string;
  const [produto, setProduto] = useState<Produto | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/produtos/${id}`),
          fetch("/api/categorias"),
        ]);
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        setProduto(prodData);
        setCategorias(catData);
      } catch (err) {
        console.error("Erro ao carregar produto:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  const handleAddToCart = () => {
    if (!produto) return;
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <main className="bg-[#f7faf8] min-h-screen pt-20 pb-16">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
            <div className="h-96 bg-white rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-white rounded w-3/4" />
              <div className="h-6 bg-white rounded w-1/2" />
              <div className="h-32 bg-white rounded" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!produto) {
    return (
      <main className="bg-[#f7faf8] min-h-screen pt-20 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1a3a2e] mb-4">
            Produto não encontrado
          </h1>
          <Link
            href="/produtos"
            className="px-6 py-2.5 bg-[#2d9569] text-white rounded-full font-semibold hover:bg-[#237852] transition-all"
          >
            Voltar aos Produtos
          </Link>
        </div>
      </main>
    );
  }

  const categoryName =
    categorias.find((c) => c.id === produto.id_categoria)?.nome ?? "Eco";
  const imgUrl =
    produto.image ??
    produto.imagem ??
    "https://via.placeholder.com/600x600/e8f5e8/28a745?text=EcoShop";
  const price = Number(produto.preco ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <main className="bg-[#f7faf8] min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">
        <div className="mb-8 flex items-center gap-2 text-sm text-[#8fa89e]">
          <Link href="/" className="hover:text-[#2d9569]">
            Início
          </Link>
          <span>/</span>
          <Link href="/produtos" className="hover:text-[#2d9569]">
            Produtos
          </Link>
          <span>/</span>
          <span className="text-[#2d9569]">{produto.nome}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="bg-white rounded-2xl p-8 border border-[#e3ede8] flex items-center justify-center min-h-96">
            <img
              src={imgUrl}
              alt={produto.nome}
              className="max-w-full max-h-96 object-contain"
            />
          </div>

          <div className="space-y-6">
            <div>
              <span className="inline-block text-xs font-bold text-[#8fa89e] uppercase tracking-widest bg-[#e6f5ef] px-3 py-1 rounded-full mb-4">
                {categoryName}
              </span>
              <h1 className="text-4xl font-extrabold text-[#1a3a2e] mb-2">
                {produto.nome}
              </h1>
              <div className="flex items-center gap-2 text-sm text-[#8fa89e]">
                <span>⭐ 4.8</span>
                <span>•</span>
                <span>152 avaliações</span>
              </div>
            </div>

            <div className="border-t border-b border-[#e3ede8] py-6">
              <p className="text-[#8fa89e] text-sm mb-2">Preço</p>
              <p className="text-4xl font-extrabold text-[#2d9569]">{price}</p>
            </div>

            <div>
              <h3 className="font-bold text-[#1a3a2e] mb-2">Sobre o Produto</h3>
              <p className="text-[#5a7a6f] leading-relaxed">
                {produto.descricao ||
                  "Produto sustentável de alta qualidade, selecionado com cuidado para atender aos nossos padrões de sustentabilidade e excelência."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "♻️", label: "Reciclável" },
                { icon: "🌱", label: "Eco-Friendly" },
                { icon: "✓", label: "Certificado" },
                { icon: "🚚", label: "Entrega Rápida" },
              ].map((f, i) => (
                <div
                  key={i}
                  className="bg-white border border-[#e3ede8] rounded-lg p-4 text-center"
                >
                  <span className="text-2xl mb-2 block">{f.icon}</span>
                  <p className="text-xs font-semibold text-[#5a7a6f]">
                    {f.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-[#e3ede8] flex items-center justify-center hover:bg-[#f1f6f3] transition-all"
                >
                  −
                </button>
                <span className="text-lg font-bold text-[#1a3a2e] min-w-[40px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-[#e3ede8] flex items-center justify-center hover:bg-[#f1f6f3] transition-all"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full bg-[#2d9569] hover:bg-[#237852] text-white font-semibold py-3.5 rounded-full transition-all duration-200"
                style={{ boxShadow: "0 4px 12px rgba(45,149,105,0.25)" }}
              >
                {addedToCart
                  ? "✓ Adicionado ao Carrinho!"
                  : "Adicionar ao Carrinho"}
              </button>

              <button className="w-full bg-white border-2 border-[#e3ede8] text-[#1a3a2e] font-semibold py-3.5 rounded-full hover:border-[#2d9569] hover:text-[#2d9569] transition-all duration-200">
                ♥ Adicionar à Wishlist
              </button>
            </div>

            <div className="bg-[#e6f5ef] rounded-lg p-4 text-sm text-[#1d5d3f]">
              <p className="font-semibold mb-1">Informações de Entrega</p>
              <p>
                Entrega em 3-5 dias úteis • Frete grátis em compras acima de R$
                150
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-12 border-t border-[#e3ede8]">
          <h2 className="text-3xl font-extrabold text-[#1a3a2e] mb-8">
            Produtos Relacionados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#e3ede8] rounded-2xl overflow-hidden group hover:-translate-y-2 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-48 bg-gradient-to-br from-[#f7faf8] to-white flex items-center justify-center">
                  <span className="text-4xl">🌿</span>
                </div>
                <div className="p-4">
                  <p className="font-bold text-[#1a3a2e]">Produto Similar</p>
                  <p className="text-[#2d9569] font-bold mt-2">R$ 49,90</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
