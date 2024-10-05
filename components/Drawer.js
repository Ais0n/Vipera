import React from 'react';

const DrawerView = ({ data }) => {
    if (!data || Object.keys(data).length === 0) {
        return null;
    }

    const renderNode = (node, level = 0) => {
        const isLeaf = !node.children || node.children.length === 0;
        const nodeStyle = isLeaf ? styles.leaf : styles.nonleaf;

        return (
            <div key={node.id} style={{ marginLeft: `${level * 10}px`, marginBottom: '5px', position: 'relative' }}>
                {level > 0 && (
                    <div style={{
                        position: 'absolute',
                        left: `15px`,
                        top: '45px',
                        height: 'calc(100% - 50px)',
                        borderLeft: '2px dashed #aaa',
                    }} />
                )}
                <div style={{ ...styles.drawer, ...nodeStyle }}>
                    {node.name} ({node.count})
                </div>
                {node.children && node.children.length > 0 && (
                    <div style={styles.children}>
                        {node.children.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            {data.children && data.children.map(child => renderNode(child, 1))}
        </div>
    );
};

const styles = {
    drawer: {
        padding: '10px',
        border: '1px solid #117250',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
        margin: '5px 0',
    },
    children: {
        marginLeft: '20px',
    },
    leaf: {
        backgroundColor: '#117250', // Darker color for leaf nodes
        color: '#fff', // Text color for better contrast
    },
    nonleaf: {
        backgroundColor: '#EFF9F5', // Lighter color for non-leaf nodes
        color: '#333', // Text color for better contrast
    }
};

export default DrawerView;