"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Produto {
  id: number;
  nome: string;
  preco: number;
  imagem?: string;
  id_categoria?: number;
}

interface Categoria {
  id: number;
  nome: string;
}

export default function StorePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/produtos"),
          fetch("/api/categorias"),
        ]);
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        setProdutos(prodData.products ?? prodData);
        setCategorias(catData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...produtos];

    if (selectedCategory !== null) {
      filtered = filtered.filter((p) => p.id_categoria === selectedCategory);
    }

    switch (sortBy) {
      case "price_asc":
        filtered.sort((a, b) => Number(a.preco) - Number(b.preco));
        break;
      case "price_desc":
        filtered.sort((a, b) => Number(b.preco) - Number(a.preco));
        break;
      case "name_asc":
        filtered.sort((a, b) => a.nome.localeCompare(b.nome));
        break;
      default:
        break;
    }

    setFilteredProdutos(filtered);
  }, [produtos, selectedCategory, sortBy]);

  return (
    <main className="bg-[#f7faf8] min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🏪</span>
            <div>
              <h1 className="text-4xl font-extrabold text-[#1a3a2e]">
                Minha Loja
              </h1>
              <p className="text-[#8fa89e] text-sm">
                Gerencie e visualize seus produtos
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            { label: "Produtos Ativos", value: "24", icon: "📦" },
            { label: "Vendas Este Mês", value: "R$ 3.240", icon: "💰" },
            { label: "Avaliação Média", value: "4.8/5", icon: "⭐" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white border border-[#e3ede8] rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{stat.icon}</span>
                <span className="text-xs font-bold text-[#8fa89e] uppercase">
                  Estatística
                </span>
              </div>
              <p className="text-2xl font-extrabold text-[#1a3a2e]">
                {stat.value}
              </p>
              <p className="text-sm text-[#8fa89e] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-[#e3ede8] sticky top-24">
              <h3 className="font-bold text-[#1a3a2e] mb-4 text-sm uppercase tracking-widest">
                Filtrar
              </h3>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-[#8fa89e] uppercase mb-3">
                  Categorias
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategory === null}
                      onChange={() => setSelectedCategory(null)}
                      className="w-4 h-4 accent-[#2d9569]"
                    />
                    <span className="text-sm text-[#5a7a6f]">Todas</span>
                  </label>
                  {categorias.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategory === cat.id}
                        onChange={() => setSelectedCategory(cat.id)}
                        className="w-4 h-4 accent-[#2d9569]"
                      />
                      <span className="text-sm text-[#5a7a6f]">{cat.nome}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#8fa89e] uppercase mb-3">
                  Ordenar
                </h4>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#e3ede8] rounded-lg focus:outline-none focus:border-[#2d9569] text-sm"
                >
                  <option value="newest">Mais Novos</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                  <option value="name_asc">Nome A-Z</option>
                </select>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-[#8fa89e]">
                {filteredProdutos.length} produto(s)
              </p>
              <button className="px-6 py-2 bg-[#2d9569] text-white rounded-full font-semibold hover:bg-[#237852] transition-all">
                + Novo Produto
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-80 bg-white rounded-2xl animate-pulse border border-[#e3ede8]"
                  />
                ))}
              </div>
            ) : filteredProdutos.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#e3ede8]">
                <p className="text-lg text-[#5a7a6f] mb-4">
                  Nenhum produto encontrado
                </p>
                <button className="px-6 py-2.5 bg-[#2d9569] text-white rounded-full font-semibold hover:bg-[#237852] transition-all">
                  Adicionar Primeiro Produto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProdutos.map((produto) => (
                  <StoreProductCard key={produto.id} produto={produto} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StoreProductCard({ produto }: { produto: Produto }) {
  const imgUrl =
    produto.imagem ??
    "https://via.placeholder.com/400x300/e8f5e8/28a745?text=EcoShop";
  const price = Number(produto.preco ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="bg-white border border-[#e3ede8] rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="relative h-60 bg-gradient-to-br from-[#f7faf8] to-white flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute top-3 right-3 flex gap-2">
          <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-[#f1f6f3] transition-all text-sm">
            ✏️
          </button>
          <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-red-50 transition-all text-sm">
            🗑
          </button>
        </div>
        <img
          src={imgUrl}
          alt={produto.nome}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-6">
        <h3 className="text-base font-bold text-[#1a3a2e] leading-snug mb-2">
          {produto.nome}
        </h3>
        <p className="text-2xl font-extrabold text-[#2d9569] mb-4">{price}</p>
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-[#e6f5ef] text-[#2d9569] rounded-lg font-semibold hover:bg-[#d0ecdf] transition-all text-sm">
            Ver
          </button>
          <button className="flex-1 px-4 py-2 bg-[#2d9569] text-white rounded-lg font-semibold hover:bg-[#237852] transition-all text-sm">
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
