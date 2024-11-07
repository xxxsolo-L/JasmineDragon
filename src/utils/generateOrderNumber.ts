
export default function generateOrderNumber(): string {
    return 'ORD-' + Math.floor(100000 + Math.random() * 900000);
}
