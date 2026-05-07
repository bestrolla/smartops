import React from 'react';

type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
};

type ProductsSectionProps = {
    products: Product[];
};

const ProductsSection: React.FC<ProductsSectionProps> = ({ products }) => {
    return (
        <section>
            <h2>Products</h2>
            <ul>
                {products.map((product) => (
                    <li key={product.id}>
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <p>Price: ${product.price}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default ProductsSection;