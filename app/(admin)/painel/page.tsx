"use client";

import { useState } from "react";
import Link from "next/link";

interface Product {
  id: number;
  nome: string;
  preco: number;
  categoria: string;
  estoque: number;
}

interface Order {
  id: number;
  cliente: string;
  total: number;
  status: "pending" | "shipped" | "delivered";
  data: string;
}

interface User {
  id: number;
  nome: string;
  email: string;
  tipo: "CLIENTE" | "LOJA" | "ADMIN";
  data: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "produtos" | "pedidos" | "usuarios"
  >("dashboard");

  const [produtos] = useState<Product[]>([
    {
      id: 1,
      nome: "Garrafa Sustentável",
      preco: 49.9,
      categoria: "Bebidas",
      estoque: 120,
    },
    {
      id: 2,
      nome: "Sacola Reutilizável",
      preco: 29.9,
      categoria: "Acessórios",
      estoque: 200,
    },
    {
      id: 3,
      nome: "Escova Biodegradável",
      preco: 15.9,
      categoria: "Higiene",
      estoque: 150,
    },
  ]);

  const [pedidos] = useState<Order[]>([
    {
      id: 1001,
      cliente: "João Silva",
      total: 189.9,
      status: "shipped",
      data: "2025-04-23",
    },
    {
      id: 1002,
      cliente: "Maria Santos",
      total: 79.8,
      status: "delivered",
      data: "2025-04-22",
    },
    {
      id: 1003,
      cliente: "Pedro Oliveira",
      total: 129.7,
      status: "pending",
      data: "2025-04-25",
    },
  ]);

  const [usuarios] = useState<User[]>([
    {
      id: 1,
      nome: "João Silva",
      email: "joao@email.com",
      tipo: "CLIENTE",
      data: "2025-03-15",
    },
    {
      id: 2,
      nome: "EcoStore",
      email: "ecostore@email.com",
      tipo: "LOJA",
      data: "2025-02-20",
    },
    {
      id: 3,
      nome: "Admin",
      email: "admin@ecoshop.com",
      tipo: "ADMIN",
      data: "2025-01-10",
    },
  ]);

  const estatisticas = {
    totalVendas: "R$ 12.450,00",
    totalPedidos: 156,
    totalUsuarios: 1240,
    produtosAtivos: 45,
  };

  return (
    <main className="bg-[#f7faf8] min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-4xl">🛡</span>
            <div>
              <h1 className="text-4xl font-extrabold text-[#1a3a2e]">
                Painel de Admin
              </h1>
              <p className="text-[#8fa89e] text-sm">
                Gerenciamento completo da plataforma
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              label: "Total de Vendas",
              value: estatisticas.totalVendas,
              icon: "💰",
            },
            { label: "Pedidos", value: estatisticas.totalPedidos, icon: "📦" },
            {
              label: "Usuários",
              value: estatisticas.totalUsuarios,
              icon: "👥",
            },
            {
              label: "Produtos Ativos",
              value: estatisticas.produtosAtivos,
              icon: "🛍",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white border border-[#e3ede8] rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{stat.icon}</span>
                <span className="text-xs font-bold text-[#8fa89e] uppercase">
                  Estatística
                </span>
              </div>
              <p className="text-2xl font-extrabold text-[#1a3a2e] mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-[#8fa89e]">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#e3ede8] rounded-2xl overflow-hidden">
          <div className="flex border-b border-[#e3ede8]">
            {[
              { id: "dashboard", label: "Dashboard", icon: "📊" },
              { id: "produtos", label: "Produtos", icon: "🛍" },
              { id: "pedidos", label: "Pedidos", icon: "📦" },
              { id: "usuarios", label: "Usuários", icon: "👥" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? "border-[#2d9569] text-[#2d9569] bg-[#e6f5ef]"
                    : "border-transparent text-[#5a7a6f] hover:text-[#1a3a2e]"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#f7faf8] rounded-lg p-6 border border-[#e3ede8]">
                  <h3 className="font-bold text-[#1a3a2e] mb-4">
                    Vendas por Mês
                  </h3>
                  <div className="h-64 flex items-end justify-around gap-2">
                    {[40, 60, 50, 80, 70, 90].map((height, i) => (
                      <div
                        key={i}
                        className="bg-[#2d9569] rounded-t"
                        style={{ height: `${height}%`, flex: 1 }}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-[#f7faf8] rounded-lg p-6 border border-[#e3ede8]">
                  <h3 className="font-bold text-[#1a3a2e] mb-4">
                    Atividade Recente
                  </h3>
                  <div className="space-y-4">
                    {[
                      "Novo pedido #1003",
                      "Novo usuário registrado",
                      "Produto adicionado",
                      "Pedido entregue #1002",
                      "Avaliação deixada",
                    ].map((activity, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 text-sm text-[#5a7a6f]"
                      >
                        <span className="w-2 h-2 bg-[#2d9569] rounded-full" />
                        {activity}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "produtos" && (
              <div>
                <div className="mb-6 flex gap-3">
                  <button className="px-6 py-2.5 bg-[#2d9569] text-white rounded-full font-semibold hover:bg-[#237852] transition-all">
                    + Novo Produto
                  </button>
                  <input
                    type="search"
                    placeholder="Buscar produtos..."
                    className="flex-1 px-4 py-2.5 border border-[#e3ede8] rounded-lg focus:outline-none focus:border-[#2d9569]"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[#e3ede8]">
                      <tr>
                        <th className="text-left font-bold text-[#1a3a2e] py-3">
                          Nome
                        </th>
                        <th className="text-left font-bold text-[#1a3a2e] py-3">
                          Categoria
                        </th>
                        <th className="text-left font-bold text-[#1a3a2e] py-3">
                          Preço
                        </th>
                        <th className="text-left font-bold text-[#1a3a2e] py-3">
                          Estoque
                        </th>
                        <th className="text-left font-bold text-[#1a3a2e] py-3">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtos.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-[#e3ede8] hover:bg-[#f7faf8]"
                        >
                          <td className="py-3 text-[#1a3a2e] font-medium">
                            {p.nome}
                          </td>
                          <td className="py-3 text-[#5a7a6f]">{p.categoria}</td>
                          <td className="py-3 text-[#2d9569] font-bold">
                            R$ {p.preco}
                          </td>
                          <td className="py-3">
                            <span className="bg-[#e6f5ef] text-[#2d9569] px-3 py-1 rounded-full text-xs font-semibold">
                              {p.estoque}
                            </span>
                          </td>
                          <td className="py-3 text-[#5a7a6f]">
                            <button className="hover:text-[#2d9569] mr-3">
                              ✏️ Editar
                            </button>
                            <button className="hover:text-red-600">
                              🗑 Deletar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "pedidos" && (
              <div>
                <div className="mb-6">
                  <input
                    type="search"
                    placeholder="Buscar pedidos..."
                    className="w-full px-4 py-2.5 border border-[#e3ede8] rounded-lg focus:outline-none focus:border-[#2d9569]"
                  />
                </div>
                <div className="space-y-4">
                  {pedidos.map((order) => (
                    <div
                      key={order.id}
                      className="bg-[#f7faf8] border border-[#e3ede8] rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-[#1a3a2e]">
                          Pedido #{order.id}
                        </p>
                        <p className="text-sm text-[#5a7a6f]">
                          {order.cliente}
                        </p>
                        <p className="text-xs text-[#8fa89e] mt-1">
                          {order.data}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#2d9569]">
                          R$ {order.total}
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                            order.status === "delivered"
                              ? "bg-green-50 text-green-700"
                              : order.status === "shipped"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-yellow-50 text-yellow-700"
                          }`}
                        >
                          {order.status === "delivered"
                            ? "✓ Entregue"
                            : order.status === "shipped"
                              ? "🚚 Enviado"
                              : "⏳ Pendente"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "usuarios" && (
              <div>
                <div className="mb-6">
                  <input
                    type="search"
                    placeholder="Buscar usuários..."
                    className="w-full px-4 py-2.5 border border-[#e3ede8] rounded-lg focus:outline-none focus:border-[#2d9569]"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[#e3ede8]">
                      <tr>
                        <th className="text-left font-bold text-[#1a3a2e] py-3">
                          Nome
                        </th>
                        <th className="text-left font-bold text-[#1a3a2e] py-3">
                          E-mail
                        </th>
                        <th className="text-left font-bold text-[#1a3a2e] py-3">
                          Tipo
                        </th>
                        <th className="text-left font-bold text-[#1a3a2e] py-3">
                          Data
                        </th>
                        <th className="text-left font-bold text-[#1a3a2e] py-3">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-[#e3ede8] hover:bg-[#f7faf8]"
                        >
                          <td className="py-3 text-[#1a3a2e] font-medium">
                            {user.nome}
                          </td>
                          <td className="py-3 text-[#5a7a6f]">{user.email}</td>
                          <td className="py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                user.tipo === "ADMIN"
                                  ? "bg-amber-50 text-amber-700"
                                  : user.tipo === "LOJA"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-[#e6f5ef] text-[#2d9569]"
                              }`}
                            >
                              {user.tipo}
                            </span>
                          </td>
                          <td className="py-3 text-[#5a7a6f] text-xs">
                            {user.data}
                          </td>
                          <td className="py-3 text-[#5a7a6f]">
                            <button className="hover:text-[#2d9569] mr-3">
                              👁 Ver
                            </button>
                            <button className="hover:text-red-600">
                              🗑 Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-[#2d9569] hover:underline font-semibold"
          >
            ← Voltar para Home
          </Link>
        </div>
      </div>
    </main>
  );
}
