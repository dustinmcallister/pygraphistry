import { container } from '@graphistry/falcor-react-redux';
import { Table } from 'react-bootstrap';
import PivotRow from './PivotRow';
//import PivotTable from './PivotTable';
import { table as tableClassName,
    tbody as tableBodyClassName,
    thead as tableHeaderClassName} from './styles.less';

import styles from './styles.less';

import { splicePivot,
        insertPivot,
        searchPivot
} from '../actions/investigation'

function renderInvestigation({length = 0, name = 'default', pivots = [], searchPivot, insertPivot, splicePivot }) {
    const cellWidth = Math.round(88 / (4));
    return (
        <div className={styles.pivots}>
            <Table>
                <thead>
                    <tr>
                        <td className={styles.pivotToggle}></td>
                        <td className={styles.pivotData0 + ' pivotTypeSelector'}>Step</td>
                        <td className={styles.pivotData1}>Parameters</td>
                        <td className={styles.pivotData2}></td>
                        <td className={styles.pivotData3}></td>
                        <td className={styles.pivotData4}></td>
                        <td className={styles.pivotResultCount}>Hits</td>
                        <td className={styles.pivotIcons}></td>
                    </tr>
                </thead>
                <tbody>
                {pivots.map((pivot, index) => (
                    <PivotRow data={pivot}
                              rowIndex={index}
                              key={`${index}: ${pivot.id}`}
                              searchPivot={searchPivot}
                              splicePivot={splicePivot}
                              insertPivot={insertPivot}/>

                ))}
                </tbody>
            </Table>
        </div>
    );
}

function mapStateToFragment({selectedInvestigation = {}, length = 0, name = 'default', ...rest} = {}) {
    return `{
        'url', 'name', 'length', [0...${length}]: ${
            PivotRow.fragment()
        }
    }`;
}

function mapFragmentToProps(fragment) {
    const output =  { pivots: fragment, name: fragment.name, length: fragment.length};
    return output;
}

export default container(
    mapStateToFragment,
    mapFragmentToProps,
    {
        splicePivot: splicePivot,
        insertPivot: insertPivot,
        searchPivot: searchPivot
    }
)(renderInvestigation)

