"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Produto {
  id: number;
  nome: string;
  preco: number;
  imagem?: string;
  image?: string;
  id_categoria?: number;
  descricao?: string;
}

interface Categoria {
  id: number;
  nome: string;
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");

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

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedCategory !== null) {
      filtered = filtered.filter((p) => p.id_categoria === selectedCategory);
    }

    filtered = filtered.filter((p) => {
      const price = Number(p.preco ?? 0);
      return price >= minPrice && price <= maxPrice;
    });

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
      case "name_desc":
        filtered.sort((a, b) => b.nome.localeCompare(a.nome));
        break;
      default:
        break;
    }

    setFilteredProdutos(filtered);
  }, [produtos, selectedCategory, minPrice, maxPrice, sortBy, searchTerm]);

  return (
    <main className="bg-[#f7faf8] min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1a3a2e] mb-4">
            Todos os Produtos
          </h1>
          <p className="text-lg text-[#5a7a6f]">
            Descubra nossa completa seleção de produtos sustentáveis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-[#e3ede8] sticky top-24 max-h-[calc(100vh-100px)] overflow-y-auto">
              <div className="mb-8">
                <label className="block text-sm font-bold text-[#1a3a2e] mb-2">
                  Buscar
                </label>
                <input
                  type="text"
                  placeholder="Nome do produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#e3ede8] rounded-lg focus:outline-none focus:border-[#2d9569] transition-colors"
                />
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-[#1a3a2e] mb-4 text-sm uppercase tracking-widest">
                  Categorias
                </h3>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCategory === null}
                      onChange={() => setSelectedCategory(null)}
                      className="w-4 h-4 accent-[#2d9569]"
                    />
                    <span className="text-sm text-[#5a7a6f] group-hover:text-[#2d9569] transition-colors">
                      Todas
                    </span>
                  </label>
                  {categorias.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategory === cat.id}
                        onChange={() => setSelectedCategory(cat.id)}
                        className="w-4 h-4 accent-[#2d9569]"
                      />
                      <span className="text-sm text-[#5a7a6f] group-hover:text-[#2d9569] transition-colors">
                        {cat.nome}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-[#1a3a2e] mb-4 text-sm uppercase tracking-widest">
                  Preço
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[#8fa89e] mb-2">
                      Mín: R$ {minPrice.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-full accent-[#2d9569]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8fa89e] mb-2">
                      Máx: R$ {maxPrice.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-[#2d9569]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-[#1a3a2e] mb-4 text-sm uppercase tracking-widest">
                  Ordenar por
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#e3ede8] rounded-lg focus:outline-none focus:border-[#2d9569] transition-colors text-sm"
                >
                  <option value="newest">Mais Novos</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                  <option value="name_asc">Nome A-Z</option>
                  <option value="name_desc">Nome Z-A</option>
                </select>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
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
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setMinPrice(0);
                    setMaxPrice(1000);
                    setSearchTerm("");
                  }}
                  className="px-6 py-2.5 border-2 border-[#2d9569] text-[#2d9569] rounded-full font-semibold hover:bg-[#2d9569] hover:text-white transition-all duration-200"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <>
                <div className="text-sm text-[#8fa89e] mb-6">
                  {filteredProdutos.length} produto(s) encontrado(s)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProdutos.map((produto) => (
                    <ProductCard
                      key={produto.id}
                      produto={produto}
                      categorias={categorias}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ProductCard({
  produto,
  categorias,
}: {
  produto: Produto;
  categorias: Categoria[];
}) {
  const categoryName =
    categorias.find((c) => c.id === produto.id_categoria)?.nome ?? "Eco";
  const imgUrl =
    produto.image ??
    produto.imagem ??
    "https://via.placeholder.com/400x300/e8f5e8/28a745?text=EcoShop";
  const price = Number(produto.preco ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <Link
      href={`/produtos/${produto.id}`}
      className="group bg-white border border-[#e3ede8] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-[#2d9569]"
    >
      <div className="h-60 bg-gradient-to-br from-[#f7faf8] to-white flex items-center justify-center p-4 relative overflow-hidden">
        <span className="absolute top-3 left-3 bg-[#e6f5ef] text-[#2d9569] text-xs font-bold px-3 py-1 rounded-full">
          Novo
        </span>
        <img
          src={imgUrl}
          alt={produto.nome}
          loading="lazy"
          className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="p-6 flex flex-col flex-1">
        <span className="text-xs font-bold text-[#8fa89e] uppercase tracking-widest mb-1">
          {categoryName}
        </span>
        <h3 className="text-base font-bold text-[#1a3a2e] leading-snug mb-auto">
          {produto.nome}
        </h3>
        <p className="text-xl font-extrabold text-[#2d9569] mt-4">{price}</p>
      </div>
    </Link>
  );
}
